export function StripeDivider() {
  return (
    <div className="flex h-1.5">
      <div className="flex-1 bg-flag-red" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-flag-blue" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-flag-red" />
    </div>
  );
}
