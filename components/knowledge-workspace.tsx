"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileArchive, FileText, Loader2, Search, Trash2, UploadCloud } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { authFetch, getValidSession } from "@/lib/auth-client";
import type { KnowledgeFile, Project } from "@/lib/supabase";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { UploadBlueprintPanel, VoraAssistantCard } from "@/components/vorqa-visuals";

const acceptedTypes = ".pdf,.docx,.txt,.md,.markdown,.csv,.xlsx,.pptx,.png,.jpg,.jpeg,.webp";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function xhrUpload({ file, projectId, onProgress, messages }: { file: File; projectId: string; onProgress: (value: number) => void; messages: { loginFirst: string; uploadFailed: string; connectionFailed: string } }) {
  return new Promise<KnowledgeFile>(async (resolve, reject) => {
    const session = await getValidSession();
    if (!session?.access_token) {
      reject(new Error(messages.loginFirst));
      return;
    }

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/knowledge");
    request.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      const data = JSON.parse(request.responseText || "{}");
      if (request.status >= 200 && request.status < 300 && data.file) resolve(data.file);
      else reject(new Error(data.error || messages.uploadFailed));
    };
    request.onerror = () => reject(new Error(messages.connectionFailed));
    request.send(formData);
  });
}

export function KnowledgeWorkspace({ projectId, projectTitle }: { projectId?: string; projectTitle?: string } = {}) {
  const { dictionary: t, locale } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [activeProjectId, setActiveProjectId] = useState(projectId || "");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      if (projectId) {
        setActiveProjectId(projectId);
        setProjects([{ id: projectId, title: projectTitle || projectId, owner_id: "", type: "document", status: "draft", metadata: {}, created_at: "", updated_at: "" }]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await authFetch("/api/projects");
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok && Array.isArray(data.projects)) {
        setProjects(data.projects);
        setActiveProjectId((current) => current || data.projects[0]?.id || "");
      } else {
        setMessage(data.error || t.projects.emptyProjectsText);
      }
      setLoading(false);
    }
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectTitle, t.projects.emptyProjectsText]);

  useEffect(() => {
    let cancelled = false;
    if (!activeProjectId) {
      setFiles([]);
      return;
    }
    async function loadFiles() {
      const response = await authFetch(`/api/knowledge?project_id=${encodeURIComponent(activeProjectId)}`);
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok && Array.isArray(data.files)) setFiles(data.files);
      else setMessage(data.error || t.projects.emptyFilesText);
    }
    loadFiles();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, t.projects.emptyFilesText]);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const visibleFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? files.filter((file) => file.original_name.toLowerCase().includes(normalized)) : files;
  }, [files, query]);

  async function uploadFiles(fileList: FileList | File[]) {
    if (!activeProjectId) {
      setMessage(t.projects.chooseProject);
      return;
    }
    for (const file of Array.from(fileList)) {
      setMessage("");
      setUploadProgress(1);
      try {
        const uploaded = await xhrUpload({
          file,
          projectId: activeProjectId,
          onProgress: setUploadProgress,
          messages: { loginFirst: t.projects.loginFirst, uploadFailed: t.projects.uploadFailed, connectionFailed: t.tools.networkError }
        });
        setFiles((current) => [uploaded, ...current]);
        setUploadProgress(null);
      } catch (error) {
        setUploadProgress(null);
        setMessage(error instanceof Error ? error.message : t.projects.uploadFailed);
        break;
      }
    }
  }

  async function deleteFile(file: KnowledgeFile) {
    setBusyFileId(file.id);
    setMessage("");
    const response = await authFetch(`/api/knowledge/${file.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusyFileId(null);
    if (!response.ok) {
      setMessage(data.error || t.projects.deleteFailed);
      return;
    }
    setFiles((current) => current.filter((item) => item.id !== file.id));
  }

  async function downloadFile(file: KnowledgeFile) {
    setBusyFileId(file.id);
    setMessage("");
    const response = await authFetch(`/api/knowledge/${file.id}/download`);
    setBusyFileId(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error || t.projects.downloadFailed);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.original_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <GlassCard className="overflow-hidden p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <Badge tone="blue">{t.projects.knowledgeBadge}</Badge>
          <h2 className="mt-4 text-2xl font-black text-[#f8efd7]">{t.projects.knowledgeTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#f8efd7]/58">{t.projects.knowledgeDescription}</p>
        </div>
        <div className="grid gap-3">
          <VoraAssistantCard message="تمت إضافة الملفات إلى قاعدة معرفة المشروع. سأستخدمها لاحقاً عند تفعيل القراءة الذكية." state="generating" />
          {projectId ? (
            <div className="rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/10 px-4 py-3">
              <p className="text-xs font-black text-[#f8efd7]/52">{t.projects.selectProject}</p>
              <p className="mt-1 truncate text-sm font-black text-[#D4AF37]">{projectTitle || projectId}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#f8efd7]/52">{t.projects.selectProject}</label>
              <select value={activeProjectId} onChange={(event) => setActiveProjectId(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-[#f8efd7] outline-none transition focus:border-[#D4AF37]/52">
                {projects.map((project) => <option key={project.id} value={project.id} className="bg-[#111827]">{project.title}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {message && <div className="mt-5 rounded-2xl border border-[#FFB020]/24 bg-[#FFB020]/10 px-4 py-3 text-sm font-bold text-[#FFD28A]">{message}</div>}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="ds-skeleton h-28 rounded-3xl" />)}</div>
      ) : projects.length === 0 ? (
        <div className="mt-6"><EmptyState title={t.projects.emptyProjects} description={t.projects.emptyProjectsText} /></div>
      ) : (
        <>
          <div className="mt-6">
            <UploadBlueprintPanel>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  uploadFiles(event.dataTransfer.files);
                }}
                className={`grid w-full place-items-center rounded-[1.75rem] border border-dashed p-8 text-center transition ${dragging ? "border-[#D4AF37]/70 bg-[#D4AF37]/10" : "border-white/12 bg-black/20 hover:border-[#D4AF37]/42 hover:bg-white/[0.045]"}`}
              >
                <input ref={inputRef} type="file" multiple accept={acceptedTypes} className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-[#D4AF37]/10 text-[#D4AF37] shadow-gold-glow"><UploadCloud className="h-8 w-8" /></span>
                <span className="mt-4 text-lg font-black text-[#f8efd7]">{t.projects.uploadTitle}</span>
                <span className="mt-2 text-sm text-[#f8efd7]/50">{t.projects.uploadHint}</span>
                {activeProject && <span className="mt-3 text-xs font-black text-[#D4AF37]">{t.projects.uploadTarget} {activeProject.title}</span>}
              </button>
            </UploadBlueprintPanel>
          </div>

          {uploadProgress !== null && <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4"><ProgressBar value={uploadProgress} label={t.projects.uploadProgress} /></div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4AF37]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.projects.fileSearch} className="h-12 w-full rounded-2xl border border-white/10 bg-black/24 pr-11 pl-4 text-sm text-[#f8efd7] outline-none placeholder:text-[#f8efd7]/34 focus:border-[#D4AF37]/44" />
            </div>
            <div className="text-sm font-bold text-[#f8efd7]/50">{visibleFiles.length} {t.projects.fileCount}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {visibleFiles.length === 0 ? (
              <EmptyState title={t.projects.emptyFiles} description={t.projects.emptyFilesText} />
            ) : (
              visibleFiles.map((file) => (
                <div key={file.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#D4AF37]/24 hover:bg-white/[0.065] md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#4F8CFF]/10 text-[#9EC0FF]">{file.mime_type.startsWith("image/") ? <FileArchive className="h-6 w-6" /> : <FileText className="h-6 w-6" />}</span>
                    <div><p className="font-black text-[#f8efd7]">{file.original_name}</p><p className="mt-1 text-xs font-bold text-[#f8efd7]/44">{formatBytes(file.size)} · {file.mime_type} · {formatDate(file.created_at, locale)}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="success">{file.status}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => downloadFile(file)} disabled={busyFileId === file.id} icon={busyFileId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}>{t.common.download}</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteFile(file)} disabled={busyFileId === file.id} icon={<Trash2 className="h-4 w-4" />}>{t.common.delete}</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}
