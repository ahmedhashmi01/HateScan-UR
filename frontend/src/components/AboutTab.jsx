import { motion } from 'framer-motion'

export default function AboutTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
    >
      <div className="font-heading text-lg text-text">About Beyond Binary</div>
      <div className="mt-2 text-sm text-muted leading-relaxed">
        <span className="text-text">Beyond Binary</span> is an academic ML project from{' '}
        <span className="text-text">Information Technology University, Pakistan</span>, focused on
        fine-grained cyberbullying and hate speech detection for{' '}
        <span className="text-text">Roman Urdu</span> social media text. The system predicts one of
        five classes: Abusive/Offensive, Normal, Religious Hate, Sexism, Profane/Untargeted.
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-[#0f0f0f] p-5">
          <div className="text-sm text-muted">Team</div>
          <ul className="mt-3 space-y-2 text-sm text-text">
            <li>Ahmad Hassan</li>
            <li>Noor Fatima</li>
            <li>Ahmed Abdullah Hashmi</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-[#0f0f0f] p-5">
          <div className="text-sm text-muted">Tech stack</div>
          <ul className="mt-3 space-y-2 text-sm text-text">
            <li>Backend: Flask API</li>
            <li>Features: TF-IDF (word + char n-grams)</li>
            <li>Models: Logistic Regression, LinearSVC, Random Forest, XGBoost</li>
            <li>Best model: XGBoost (F1-macro 0.691, 79% test accuracy)</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-[#0f0f0f] p-5">
        <div className="text-sm text-muted">Why “Beyond Binary”?</div>
        <div className="mt-2 text-sm text-muted leading-relaxed">
          Most moderation systems stop at toxic vs non-toxic. This project aims for interpretable,
          fine-grained categories to support better reporting, analytics, and policy decisions in
          multilingual social contexts.
        </div>
      </div>
    </motion.div>
  )
}

