import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function diasEntre(a, b) {
  if (!a || !b) return null;
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export async function GET(request, { params }) {
  try {
    const ticker = params.ticker.toUpperCase();

    const { data } = await supabaseAdmin
      .from('paginas')
      .select('datos')
      .eq('ticker', ticker)
      .maybeSingle();

    if (!data || !data.datos) {
      return Response.json({ futuro: null });
    }

    let datos = data.datos;
    if (typeof datos === 'string') {
      try {
        datos = JSON.parse(datos);
      } catch (e) {
        return Response.json({ futuro: null });
      }
    }

    let smis = datos.smisUltimos60;
    if (typeof smis === 'string') {
      try {
        smis = JSON.parse(smis);
      } catch (e) {
        return Response.json({ futuro: null });
      }
    }
    if (!Array.isArray(smis) || smis.length < 5) {
      return Response.json({ futuro: null });
    }

    let velas = datos.velasUltimos60;
    if (typeof velas === 'string') {
      try {
        velas = JSON.parse(velas);
      } catch (e) {
        return Response.json({ futuro: null });
      }
    }
    if (!Array.isArray(velas)) {
      return Response.json({ futuro: null });
    }

    const smiActual = Number(datos.smiActual);
    if (isNaN(smiActual)) {
      return Response.json({ futuro: null });
    }

    const validos = smis.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (validos.length < 2) {
      return Response.json({ futuro: null });
    }

    const ultimo = validos[validos.length - 1];
    const anterior = validos[validos.length - 2];
    const direccionActual =
      ultimo > anterior ? 'subiendo' : ultimo < anterior ? 'bajando' : 'plana';

    if (direccionActual === 'plana') {
      return Response.json({ futuro: null });
    }

    const casos = [];

    for (let i = 0; i < smis.length - 2; i++) {
      const smi = smis[i];
      if (smi === null || smi === undefined || isNaN(smi)) continue;
      if (Math.abs(smi - smiActual) > 20) continue;

      let prevValido = null;
      for (let k = i - 1; k >= 0; k--) {
        if (smis[k] !== null && smis[k] !== undefined && !isNaN(smis[k])) {
          prevValido = smis[k];
          break;
        }
      }
      if (prevValido === null || prevValido === smi) continue;

      const dirSesion = smi > prevValido ? 'subiendo' : 'bajando';
      if (dirSesion !== direccionActual) continue;

      let diasGiro = null;
      let fechaGiro = null;

      for (let j = i + 1; j < smis.length; j++) {
        if (smis[j] === null || smis[j] === undefined || isNaN(smis[j])) continue;

        let prevJ = null;
        for (let k = j - 1; k >= 0; k--) {
          if (smis[k] !== null && smis[k] !== undefined && !isNaN(smis[k])) {
            prevJ = smis[k];
            break;
          }
        }
        if (prevJ === null || prevJ === smis[j]) continue;

        const dirJ = smis[j] > prevJ ? 'subiendo' : 'bajando';
        if (dirJ !== dirSesion) {
          if (velas[i] && velas[j] && velas[i].date && velas[j].date) {
            const d = diasEntre(velas[i].date, velas[j].date);
            if (d !== null && d >= 0) {
              diasGiro = d;
              fechaGiro = velas[j].date;
            }
          }
          break;
        }
      }

      if (diasGiro !== null) {
        casos.push({
          fecha: velas[i]?.date || '',
          fechaGiro,
          smi,
          dias: diasGiro
        });
      }
    }

    if (casos.length === 0) {
      return Response.json({
        futuro: {
          direccionActual,
          casos: [],
          ultimoCaso: null,
          mediaDias: null
        }
      });
    }

    const mediaDias = casos.reduce((a, c) => a + c.dias, 0) / casos.length;

    return Response.json({
      futuro: {
        direccionActual,
        casos,
        ultimoCaso: casos[casos.length - 1],
        mediaDias
      }
    });
  } catch (err) {
    console.error('Error en /api/futuro:', err);
    return Response.json({ futuro: null }, { status: 200 });
  }
}
