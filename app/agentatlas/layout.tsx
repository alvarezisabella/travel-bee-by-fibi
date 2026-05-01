import ChatWidget from "./Chatwidget";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <ChatWidget /> {/* Scoped to agentatlas */}
    </div>
  );
}