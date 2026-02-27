import { quizCategories } from "../data/mockQuizzes";
import CategorySection from "../components/CategorySection";

export default function ExplorePage() {
  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold">Explore Page</h1>

      {quizCategories.map((category, index) => (
        <div key={index}>
          <h2 className="text-xl font-semibold">{category.title}</h2>
        </div>
      ))}
    </div>
  );
}