


export function Footer() {
    return (
        <footer className="border-t bg-card py-6 mt-auto print:hidden">
            <div className="container flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} KSCRM. Todos os direitos reservados.</p>
            </div>
        </footer>
    )
}
