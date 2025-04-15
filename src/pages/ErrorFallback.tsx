export default function ErrorFallback() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold text-red-600">Something went wrong</h1>
      <p className="text-gray-500">
        An unexpected error occurred. Please try again later.
      </p>
    </div>
  );
}
