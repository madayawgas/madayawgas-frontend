export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-md" 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl p-8 w-full shadow-2xl relative animate-scale-in ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-[#1B4B75] text-2xl font-bold mb-6 border-b pb-4">
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}