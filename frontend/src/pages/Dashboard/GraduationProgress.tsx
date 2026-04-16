import ProgressBar from '../../components/ProgressBar';
import { Card } from '../../components/ui';
import { useStudentStore } from '../../store/useStudentStore';

const GraduationProgress = () => {
    const { profile, graduationPct } = useStudentStore();

    return (
        <Card>
            <h3 className="text-lg font-semibold text-text-base mb-3">
                Graduation Progress
            </h3>
            <ProgressBar
                label={`${profile.creditsPassed} / ${profile.totalCreditsRequired} credits`}
                gradPct={graduationPct}
            />
        </Card>
    )
}

export default GraduationProgress