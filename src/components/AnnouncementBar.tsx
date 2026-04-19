const AnnouncementBar = () => {
  return (
    <div className="bg-olive text-olive-foreground py-2 overflow-hidden">
      <div className="marquee whitespace-nowrap flex gap-16">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="text-sm font-light tracking-wide">
            🌿 Free Shipping on Orders Over £50 &nbsp;&nbsp;•&nbsp;&nbsp; 🧪 Lab
            Tested & Certified &nbsp;&nbsp;•&nbsp;&nbsp; 🌱 100% Organic Hemp
            &nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
