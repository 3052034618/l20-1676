import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import TypeSelector from './components/TypeSelector';
import BasicForm from './components/BasicForm';
import ComicSelector from './components/ComicSelector';
import ChapterRangePreview from './components/ChapterRangePreview';
import { hasErrors } from '@/utils/validators';

export default function CouponConfig() {
  const navigate = useNavigate();
  const { config, validate, errors } = useCouponStore();

  const handleNext = () => {
    const isValid = validate();
    if (isValid) {
      navigate('/preview');
    }
  };

  const isValid = !hasErrors(errors) && config.type && config.selectedComicIds.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">券包配置</h1>
          <p className="text-ink-400 mt-1">配置券包类型、参数和适用作品</p>
        </div>
        <div className="flex items-center gap-3">
          {isValid && (
            <div className="flex items-center gap-2 text-accent-green">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">配置有效</span>
            </div>
          )}
          <button
            onClick={handleNext}
            disabled={!isValid}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前往预览
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section className="card p-6">
          <TypeSelector />
        </section>

        {config.type && (
          <>
            <section className="card p-6">
              <BasicForm />
            </section>

            <section className="card p-6">
              <ComicSelector />
            </section>

            <section className="card p-6">
              <ChapterRangePreview />
            </section>
          </>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          前往预览
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
