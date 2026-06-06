import { CourseEnrollment } from "./course-enrollment";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CourseEnrollment slug={slug} />;
}
