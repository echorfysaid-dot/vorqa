"use client";

import { useEffect, useState } from "react";
import { projectRepository, type DemoProject, type ProjectRepositoryResult } from "./projectRepository";

type ProjectsState = ProjectRepositoryResult<DemoProject[]> & {
  loading: boolean;
};

type ProjectState = ProjectRepositoryResult<DemoProject | undefined> & {
  loading: boolean;
};

export function useProjectsRepository(): ProjectsState {
  const [state, setState] = useState<ProjectsState>({
    data: projectRepository.list(),
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    projectRepository.getProjects().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useProjectRepository(projectId: string): ProjectState {
  const [state, setState] = useState<ProjectState>({
    data: projectRepository.getById(projectId),
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    projectRepository.getProjectById(projectId).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  return state;
}

export function useProjectMembersRepository(projectId: string) {
  const [state, setState] = useState<ProjectRepositoryResult<import("@/lib/models").ProjectMember[]> & { loading: boolean }>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    projectRepository.getProjectMembers(projectId).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  return state;
}
