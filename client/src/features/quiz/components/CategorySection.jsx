import QuizCard from "./QuizCard";

export default function CategorySection({ category }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{category.title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {category.quizzes.map((quiz, index) => (
          <QuizCard key={index} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}