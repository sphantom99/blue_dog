import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui';
import { useStudentStore } from '../../store/useStudentStore';

const History = () => {
    const navigate = useNavigate();
    const { profile } = useStudentStore();
    return (
        <Card noPadding>
            <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-base">
                    Course History
                </h3>
                <button
                    type="button"
                    onClick={() => navigate("/enroll")}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
                >
                    Plan Semester
                </button>
            </div>
            {profile.courseHistory.length === 0 ? (
                <div className="p-6 text-center text-text-muted">
                    No course history yet. Start planning your first semester!
                </div>
            ) : (
                <table className="w-full">
                    <thead className="bg-surface-muted">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                                Course
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                                Semester
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                                Credits
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {profile.courseHistory
                            .sort((a, b) => {
                                const semA = `${a.semesterYear}-${a.semesterName}`;
                                const semB = `${b.semesterYear}-${b.semesterName}`;
                                if (semA !== semB) return semB.localeCompare(semA);
                                return a.courseCode.localeCompare(b.courseCode);
                            })
                            .map((ch) => (
                                <tr
                                    key={`${ch.courseId}-${ch.semesterYear}`}
                                    className="hover:bg-surface-muted"
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-text-base">
                                            {ch.courseCode}
                                        </p>
                                        <p className="text-sm text-text-muted">{ch.courseName}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-muted">
                                        {ch.semesterName} {ch.semesterYear}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-text-muted">
                                        {ch.credits}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ch.status === "passed"
                                                ? "bg-success-100 text-success-800"
                                                : "bg-danger-100 text-danger-800"
                                                }`}
                                        >
                                            {ch.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            )}
        </Card>
    )
}

export default History