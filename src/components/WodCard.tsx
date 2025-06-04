type WodProps = {
  date: string;
  title: string;
  type: ("cardio" | "gymnastics" | "strength")[];
  description: string;
  level: string;
  isAdmin?: boolean;
  onEditClick?: () => void;
};

export default function WodCard({
  date,
  title,
  type,
  description,
  level,
  isAdmin = false,
  onEditClick,
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
    <div className="bg-white shadow-md rounded-lg p-4 relative">
      {/* 우상단 연필 아이콘 (관리자만) */}
      {isAdmin && (
        <button
          className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
          onClick={onEditClick}
          aria-label="WOD 수정"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-gray-500 hover:text-[#3b2ff5]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 14.362-14.303z"
            />
          </svg>
        </button>
      )}
      <div className="flex items-center mb-2">
        <div className="flex items-center gap-2">
          {type.map((t) => (
            <div key={t} className="flex items-center">
              <span className="text-xl mr-1">{typeIconMap[t]}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs text-white ${typeColorMap[t]}`}
              >
                {t}
              </span>
            </div>
          ))}
        </div>
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
