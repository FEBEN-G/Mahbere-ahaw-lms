"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileDropzone } from "@/components/uploads/file-dropzone";
import { Panel } from "@/components/layout/panel";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/feedback";
import {
  addVideoLinkRequest,
  assignInstructorRequest,
  createCourseRequest,
  createModuleRequest,
  deleteCourseRequest,
  getCourseRequest,
  listCoursesRequest,
  publishCourseRequest,
  unpublishCourseRequest,
  uploadModuleFileRequest,
} from "@/lib/courses/api";
import { courseStatusLabel } from "@/lib/content/display-labels";
import { listUsersRequest } from "@/lib/users/api";
import { findDuplicateUpload } from "@/lib/uploads/duplicate-file";

export function AdminCoursesPanel() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [monthNumber, setMonthNumber] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => listCoursesRequest(),
  });

  const courseDetailQuery = useQuery({
    queryKey: ["course", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: () => getCourseRequest(selectedCourseId),
  });

  const instructorsQuery = useQuery({
    queryKey: ["users", "INSTRUCTOR"],
    queryFn: () => listUsersRequest({ role: "INSTRUCTOR" }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCourseRequest({
        title,
        monthNumber,
        description: `Month ${monthNumber} course`,
      }),
    onSuccess: async () => {
      setTitle("");
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: publishCourseRequest,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishCourseRequest,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourseRequest,
    onSuccess: async (_data, courseId) => {
      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
        setSelectedModuleId("");
      }
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const moduleMutation = useMutation({
    mutationFn: () =>
      createModuleRequest(selectedCourseId, {
        title: moduleTitle,
        description: "Course module",
      }),
    onSuccess: async () => {
      setModuleTitle("");
      await queryClient.invalidateQueries({
        queryKey: ["course", selectedCourseId],
      });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const videoMutation = useMutation({
    mutationFn: () =>
      addVideoLinkRequest(selectedModuleId, {
        title: videoTitle,
        externalUrl: videoUrl,
      }),
    onSuccess: async () => {
      setVideoTitle("");
      setVideoUrl("");
      await queryClient.invalidateQueries({
        queryKey: ["course", selectedCourseId],
      });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const fileMutation = useMutation({
    mutationFn: (file: File) => uploadModuleFileRequest(selectedModuleId, file),
    onSuccess: async () => {
      setUploadMessage("File uploaded successfully.");
      setActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["course", selectedCourseId],
      });
    },
    onError: (error: Error) => {
      setUploadMessage(null);
      setActionError(error.message || "Upload failed. Try again.");
    },
  });

  const assignInstructorMutation = useMutation({
    mutationFn: () =>
      assignInstructorRequest(selectedCourseId, selectedInstructorId),
    onSuccess: async () => {
      setSelectedInstructorId("");
      await queryClient.invalidateQueries({
        queryKey: ["course", selectedCourseId],
      });
    },
    onError: (error: Error) => setActionError(error.message),
  });

  const courses = coursesQuery.data ?? [];
  const modules = courseDetailQuery.data?.modules ?? [];
  const selectedModule = modules.find((module) => module.id === selectedModuleId);
  const moduleUploads =
    selectedModule?.attachments
      .filter(
        (attachment): attachment is typeof attachment & {
          originalName: string;
          mimeType: string;
          sizeBytes: number;
        } =>
          Boolean(
            attachment.originalName &&
              attachment.mimeType &&
              attachment.sizeBytes != null,
          ),
      )
      .map((attachment) => ({
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })) ?? [];
  const assignedInstructors = courseDetailQuery.data?.instructors ?? [];
  const instructors = instructorsQuery.data ?? [];
  const assignedIds = new Set(
    assignedInstructors.map((item) => item.instructor.id),
  );
  const availableInstructors = instructors.filter(
    (user) =>
      user.instructorProfile && !assignedIds.has(user.instructorProfile.id),
  );

  const publishedSlots = useMemo(() => {
    const map = new Map<number, number>();
    for (const course of courses) {
      if (course.status !== "PUBLISHED") continue;
      map.set(course.monthNumber, (map.get(course.monthNumber) ?? 0) + 1);
    }
    return map;
  }, [courses]);

  const monthSlotCount = publishedSlots.get(monthNumber) ?? 0;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  return (
    <div className="space-y-6">
      <Panel
        title="Create course"
        description="Each month can have at most 2 live courses for students."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto]">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink/70">Title</span>
            <input
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Introduction to Theology"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink/70">Month</span>
            <input
              type="number"
              min={1}
              max={24}
              className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
              value={monthNumber}
              onChange={(event) => setMonthNumber(Number(event.target.value))}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!title || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="w-full rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/55">
          Month {monthNumber} live courses: {monthSlotCount}/2
        </p>
        {actionError ? (
          <div className="mt-3">
            <ErrorBanner message={actionError} />
          </div>
        ) : null}
        {uploadMessage ? (
          <p className="mt-3 rounded-xl border border-forest/30 bg-sand px-3 py-2 text-sm text-forest">
            {uploadMessage}
          </p>
        ) : null}
      </Panel>

      <Panel
        title="Courses"
        description="Select a course to manage instructors, modules, and reading materials."
      >
        {coursesQuery.isLoading ? (
          <LoadingBlock label="Loading courses…" />
        ) : coursesQuery.isError ? (
          <ErrorBanner
            message={(coursesQuery.error as Error).message}
            onRetry={() => void coursesQuery.refetch()}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Create the first monthly course above."
          />
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className={`rounded-xl border px-3 py-3 ${
                  selectedCourseId === course.id
                    ? "border-forest/40 bg-sand/40"
                    : "border-line/70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setSelectedModuleId("");
                      setActionError(null);
                      setUploadMessage(null);
                    }}
                    className="text-left"
                  >
                    <span className="font-medium text-ink">
                      Month {course.monthNumber}: {course.title}
                    </span>
                    <span className="ml-2 text-xs font-medium text-ink/55">
                      {courseStatusLabel(course.status)}
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {course.status === "DRAFT" ? (
                      <button
                        type="button"
                        onClick={() => publishMutation.mutate(course.id)}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-sand"
                      >
                        Publish
                      </button>
                    ) : null}
                    {course.status === "PUBLISHED" ? (
                      <button
                        type="button"
                        onClick={() => unpublishMutation.mutate(course.id)}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-sand"
                      >
                        Unpublish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${course.title}"? This soft-deletes the course and its modules.`,
                          )
                        ) {
                          deleteMutation.mutate(course.id);
                        }
                      }}
                      className="rounded-lg border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selectedCourseId ? (
        <>
          <Panel
            title={`Instructors · ${selectedCourse?.title ?? "Course"}`}
            description="Assign instructors who can grade this course."
          >
            {courseDetailQuery.isLoading ? (
              <LoadingBlock label="Loading course details…" />
            ) : (
              <div className="space-y-4">
                {assignedInstructors.length === 0 ? (
                  <EmptyState
                    title="No instructors assigned"
                    description="Select an instructor below to grant grading access."
                  />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {assignedInstructors.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-line/70 px-3 py-2"
                      >
                        {item.instructor.user.firstName}{" "}
                        {item.instructor.user.lastName}
                        <span className="text-ink/50">
                          {" "}
                          · {item.instructor.user.email}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-ink/70">Instructor</span>
                    <select
                      className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
                      value={selectedInstructorId}
                      onChange={(event) =>
                        setSelectedInstructorId(event.target.value)
                      }
                    >
                      <option value="">Select instructor</option>
                      {availableInstructors.map((user) => (
                        <option
                          key={user.id}
                          value={user.instructorProfile?.id ?? ""}
                        >
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={
                        !selectedInstructorId ||
                        assignInstructorMutation.isPending
                      }
                      onClick={() => assignInstructorMutation.mutate()}
                      className="w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-sand disabled:opacity-60 sm:w-auto"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="Modules & materials"
            description="Add modules, instructional videos, and PDF/Word readings."
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">New module</span>
                <input
                  className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
                  value={moduleTitle}
                  onChange={(event) => setModuleTitle(event.target.value)}
                  placeholder="Module title"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!moduleTitle || moduleMutation.isPending}
                  onClick={() => moduleMutation.mutate()}
                  className="w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-sand disabled:opacity-60 sm:w-auto"
                >
                  Add module
                </button>
              </div>
            </div>

            {modules.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No modules yet"
                  description="Add a module, then attach readings or video links."
                />
              </div>
            ) : (
              <label className="mt-4 block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">
                  Module for attachments
                </span>
                <select
                  className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
                  value={selectedModuleId}
                  onChange={(event) => setSelectedModuleId(event.target.value)}
                >
                  <option value="">Select module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedModuleId ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink/70">Video title</span>
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
                    value={videoTitle}
                    onChange={(event) => setVideoTitle(event.target.value)}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-ink/70">Video URL</span>
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2.5 outline-none ring-forest/20 focus:ring-2"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder="YouTube / Vimeo URL"
                  />
                </label>
                <button
                  type="button"
                  disabled={!videoTitle || !videoUrl || videoMutation.isPending}
                  onClick={() => videoMutation.mutate()}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-sand disabled:opacity-60"
                >
                  Add instructional video
                </button>
                <p className="self-center text-xs text-ink/55 sm:col-span-1">
                  Students see an embedded player for YouTube/Vimeo links.
                </p>
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-sm font-medium text-ink/70">
                    Reading material
                  </p>
                  <FileDropzone
                    disabled={fileMutation.isPending}
                    label={
                      fileMutation.isPending
                        ? "Uploading..."
                        : "Drop PDF or Word (.docx) reading material"
                    }
                    onFile={(file) => {
                      setUploadMessage(null);
                      setActionError(null);
                      if (findDuplicateUpload(file, moduleUploads)) {
                        setActionError("File already uploaded.");
                        return;
                      }
                      fileMutation.mutate(file);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
