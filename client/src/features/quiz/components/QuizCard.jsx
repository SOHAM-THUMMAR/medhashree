import { Link } from "react-router-dom";

export default function QuizCard({ quiz }) {
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow hover:shadow-lg transition">
      <h3 className="font-semibold mb-2">{quiz.title}</h3>

      <p className="text-sm text-gray-500 mb-2">
        {quiz.questions} Questions
      </p>

      <Link
        to="/play"
        className="inline-block text-sm bg-black text-white px-4 py-1 rounded"
      >
        Play Now
      </Link>
    </div>
  );
}