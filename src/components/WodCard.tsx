type WodProps = {
  date: string;
  title: string;
  type: "cardio" | "gymnastics" | "strength";
  description: string;
  level: string;
};

export default function WodCard({
  date,
  title,
  type,
  description,
  level,
}: WodProps) {
  const typeColorMap = {
    cardio: "bg-blue-500",
    gymnastics: "bg-green-500",
    strength: "bg-red-500",
  };

  const typeIconMap = {
    cardio: "🏃‍♂️",
    gymnastics: "🤸‍♂️",
    strength: "🏋️‍♂️",
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex items-center mb-2">
        <span className="text-gray-500 text-sm mr-2">{typeIconMap[type]}</span>
        <span
          className={`px-2 py-1 rounded-full text-xs text-white ${typeColorMap[type]}`}
        >
          {type}
        </span>
      </div>

      <div className="pl-4">
        <span className="text-gray-500 text-sm block mb-1">{date}</span>
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-gray-600 mb-2 whitespace-pre-line">{description}</p>

        <div className="flex items-start">
          {/* <span className="text-sm text-gray-500">난이도:</span> */}
          <span className="text-sm font-medium whitespace-pre-line">
            {level}
          </span>
        </div>
      </div>
    </div>
  );
}
