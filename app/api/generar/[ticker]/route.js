import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../../lib/autogenerar';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request, { params }) {
  const ticker = params.ticker.toUpperCase();

  try {
    const empresa = await obtenerOCrearEmpresa(ticker);
    if (!empresa) {
      return Response.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const { analisis } = await obtenerAnalisis(ticker, empresa);

    return Response.json({
      ok: true,
      empresa: {
        ticker: empresa.ticker,
        nombre: empresa.nombre,
        sector: empresa.sector
      },
      generado_at: analisis.generado_at
    });
  } catch (err) {
    console.error('Error generando:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
