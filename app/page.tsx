export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-black text-primary">
          SOFHIA Enterprise
        </h1>
        <p className="text-xl text-muted-foreground">
          Automação Inteligente para Provedores de Internet
        </p>
        <div className="flex gap-4 justify-center items-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Sistema em Construção</span>
          </div>
        </div>
      </div>
    </div>
  );
}
