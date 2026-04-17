import { Card } from '../../components/ui';
import { useCountUp } from '../../lib/useCountUp';
import { useStudentStore } from '../../store/useStudentStore';

const StudentInfoCard = () => {

    const { profile, graduationPct } = useStudentStore();

    const gpaRef = useCountUp<HTMLParagraphElement>(profile?.gpa ?? 0, { decimalPlaces: 2, duration: 1.5 });
    const creditsRef = useCountUp<HTMLParagraphElement>(profile?.creditsPassed ?? 0, { duration: 1.5 });
    const gradPctRef = useCountUp<HTMLParagraphElement>(graduationPct, { duration: 1.5, suffix: '%' });

    return (
        <Card className="flex flex-wrap items-center justify-between gap-6">
            <div>
                <h2 className="text-2xl font-bold text-text-base">
                    {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-text-muted mt-1">
                    Grade {profile.gradeLevel} · {profile.email}
                </p>
            </div>
            <div className="flex gap-6 text-center">
                <div className="bg-primary-50 rounded-lg px-5 py-3">
                    <p className="text-2xl font-bold text-primary-600" ref={gpaRef} />
                    <p className="text-xs text-text-muted uppercase tracking-wide">GPA</p>
                </div>
                <div className="bg-success-50 rounded-lg px-5 py-3">
                    <p className="text-2xl font-bold text-success-600" ref={creditsRef} />
                    <p className="text-xs text-text-muted uppercase tracking-wide">
                        Credits Earned
                    </p>
                </div>
                <div className="bg-warning-50 rounded-lg px-5 py-3">
                    <p className="text-2xl font-bold text-warning-600" ref={gradPctRef} />
                    <p className="text-xs text-text-muted uppercase tracking-wide">
                        Graduation
                    </p>
                </div>
            </div>
        </Card>
    )
}

export default StudentInfoCard