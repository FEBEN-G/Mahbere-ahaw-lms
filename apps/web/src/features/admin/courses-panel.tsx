"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileDropzone } from "@/components/uploads/file-dropzone";
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
    queryFn: listCoursesRequest,
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
      await queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
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
      await queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
    },
  });

  const fileMutation = useMutation({
    mutationFn: (file: File) => uploadModuleFileRequest(selectedModuleId, file),
    onSuccess: async () => {
      setUploadMessage("File uploaded successfully.");
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
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
      await queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] });
    },
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

  return (
    <section className="space-y-4 rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)]">
      <p className="text-sm text-ink/65">
        Create monthly courses, upload PDF/Word reading materials, and add
        instructional video links. Each month can have at most{" "}
        <strong>2 published</strong> courses for drip delivery.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
          placeholder="Course title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          type="number"
          min={1}
          max={24}
          className="w-24 rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
          value={monthNumber}
          onChange={(event) => setMonthNumber(Number(event.target.value))}
        />
        <button
          type="button"
          disabled={!title || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
        >
          Create course
        </button>
      </div>
      <p className="text-xs text-ink/55">
        Month {monthNumber} published slots used: {monthSlotCount}/2
      </p>

      {actionError ? (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
          {actionError}
        </p>
      ) : null}
      {uploadMessage ? (
        <p className="rounded-md border border-forest/30 bg-sand px-3 py-2 text-sm text-forest">
          {uploadMessage}
        </p>
      ) : null}

      <ul className="space-y-2 text-sm">
        {courses.map((course) => (
          <li
            key={course.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line/70 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => setSelectedCourseId(course.id)}
              className={`text-left ${
                selectedCourseId === course.id ? "font-semibold text-forest" : ""
              }`}
            >
              Month {course.monthNumber}: {course.title}{" "}
              <span className="text-ink/50">({course.status})</span>
            </button>
            <div className="flex flex-wrap gap-2">
              {course.status === "DRAFT" ? (
                <button
                  type="button"
                  onClick={() => publishMutation.mutate(course.id)}
                  className="rounded-md border border-line px-2 py-1 text-xs hover:bg-sand"
                >
                  Publish
                </button>
              ) : null}
              {course.status === "PUBLISHED" ? (
                <button
                  type="button"
                  onClick={() => unpublishMutation.mutate(course.id)}
                  className="rounded-md border border-line px-2 py-1 text-xs hover:bg-sand"
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
                className="rounded-md border border-accent/40 px-2 py-1 text-xs text-accent hover:bg-accent/10"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedCourseId ? (
        <>
          <div className="space-y-3 rounded-lg border border-line/70 bg-sand/20 p-4">
            <h3 className="font-medium text-ink">Assigned instructors</h3>
            {assignedInstructors.length === 0 ? (
              <p className="text-sm text-ink/60">No instructors assigned yet.</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink/80">
                {assignedInstructors.map((item) => (
                  <li key={item.id}>
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
            <div className="flex flex-wrap gap-2">
              <select
                className="min-w-[220px] rounded-md border border-line px-3 py-2 text-sm"
                value={selectedInstructorId}
                onChange={(event) => setSelectedInstructorId(event.target.value)}
              >
                <option value="">Select instructor to assign</option>
                {availableInstructors.map((user) => (
                  <option
                    key={user.id}
                    value={user.instructorProfile?.id ?? ""}
                  >
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={
                  !selectedInstructorId || assignInstructorMutation.isPending
                }
                onClick={() => assignInstructorMutation.mutate()}
                className="rounded-md border border-line px-3 py-2 text-sm hover:bg-sand disabled:opacity-60"
              >
                Assign instructor
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-line/70 bg-sand/20 p-4">
            <h3 className="font-medium text-ink">Manage modules</h3>
            <div className="flex flex-wrap gap-2">
              <input
                className="rounded-md border border-line px-3 py-2 text-sm"
                placeholder="Module title"
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
              />
              <button
                type="button"
                disabled={!moduleTitle || moduleMutation.isPending}
                onClick={() => moduleMutation.mutate()}
                className="rounded-md border border-line px-3 py-2 text-sm hover:bg-sand disabled:opacity-60"
              >
                Add module
              </button>
            </div>

            {modules.length > 0 ? (
              <select
                className="w-full rounded-md border border-line px-3 py-2 text-sm"
                value={selectedModuleId}
                onChange={(event) => setSelectedModuleId(event.target.value)}
              >
                <option value="">Select module for attachments</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            ) : null}

            {selectedModuleId ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-md border border-line px-3 py-2 text-sm"
                  placeholder="Video title"
                  value={videoTitle}
                  onChange={(event) => setVideoTitle(event.target.value)}
                />
                <input
                  className="rounded-md border border-line px-3 py-2 text-sm"
                  placeholder="YouTube / Vimeo / video URL"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                />
                <button
                  type="button"
                  disabled={!videoTitle || !videoUrl || videoMutation.isPending}
                  onClick={() => videoMutation.mutate()}
                  className="rounded-md border border-line px-3 py-2 text-sm hover:bg-sand disabled:opacity-60"
                >
                  Add instructional video
                </button>
                <p className="sm:col-span-2 text-xs text-ink/55">
                  Students see an in-app embedded player for YouTube/Vimeo links.
                </p>
                <div className="sm:col-span-2">
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
          </div>
        </>
      ) : null}
    </section>
  );
}
