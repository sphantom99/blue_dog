import { Card } from '../../components/ui';
import { formatMeetingTimes } from '../../lib/formatMeetingTime';
import { SUBJECT_COLORS } from '../../lib/specializationColors';
import { useCourseStore } from '../../store/useCourseStore';

const CurrentSubjects = () => {
    const { schedule } = useCourseStore();
    return (
        <Card>
            <h3 className="text-lg font-semibold text-text-base mb-3">
                Current Subjects
            </h3>
            {schedule?.enrolledSections.length === 0 ? (
                <p className="text-text-muted">
                    Not enrolled in any courses this semester.
                </p>
            ) : (
                <ul className="list-disc list-inside space-y-1">
                    {schedule?.enrolledSections.map((section) => (
                        <li
                            key={section.id}
                            className={`rounded-lg px-2 py-1 ${SUBJECT_COLORS[section.specialization]?.bg || "bg-surface-subtle"} ${SUBJECT_COLORS[section.specialization]?.text || "text-text-base"}`}
                        >
                            {section.courseCode} - {section.courseName}
                            <span className="text-sm text-text-muted">
                                {" — "}
                                {formatMeetingTimes(section.meetings)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

export default CurrentSubjects