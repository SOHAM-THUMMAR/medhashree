function MessagesPanel({ onClose, latestNews }) {
  return (
    <div className="fixed right-2 sm:right-4 top-16 sm:top-20 w-[calc(100vw-16px)] sm:w-80 bg-white dark:bg-brand-dark rounded-xl shadow-xl z-50">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-white/10">
        <h3 className="font-semibold">Recent Messages</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <ul className="p-3 space-y-3 text-sm">
        {latestNews && (
          <li className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
            <div className="text-[10px] uppercase font-bold text-indigo-500 mb-1">{latestNews.tag || 'LATEST NEWS'}</div>
            <div className="font-semibold">{latestNews.title}</div>
            <div className="text-gray-500 text-xs mt-0.5 max-h-16 overflow-hidden text-ellipsis">{latestNews.description}</div>
          </li>
        )}
        {/* <li>Alex Johnson – Ready for quiz tournament?</li>
        <li>Michael Brown – Team quiz tomorrow</li>
        <li>Sarah Williams – Thanks for help!</li>
        <li>Emily Davis – Shared quiz resources</li> */}
      </ul>
    </div>
  );
}

export default MessagesPanel;