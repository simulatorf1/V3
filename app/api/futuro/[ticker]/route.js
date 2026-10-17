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
      return Response.json({
        futuro: null,
        motivo: 'No hay datos en Supabase para este ticker'
      });
    }

    let datos = data.datos;
    console.log('[FUTURO-API] tipo datos:', typeof datos);
    console.log('[FUTURO-API] primeros 100 chars:', String(datos).substring(0, 100));
    console.log('[FUTURO-API] tiene smisUltimos60?:', String(datos).includes('smisUltimos60'));    
    if (typeof datos === 'string') {
      try {
        datos = JSON.parse(datos);
      } catch (e) {
        return Response.json({
          futuro: null,
          motivo: 'JSON no parseable: ' + e.message
        });
      }
    }

    let smis = datos.smisUltimos60;
    if (typeof smis === 'string') {
      try {
        smis = JSON.parse(smis);
      } catch (e) {
        return Response.json({
          futuro: null,
          motivo: 'smisUltimos60 no parseable: ' + e.message,
          valor: smis.substring(0, 200)
        });
      }
    }
    if (!Array.isArray(smis)) {
      return Response.json({
        futuro: null,
        motivo: 'smisUltimos60 no es array. Tipo: ' + typeof smis,
        valor: String(smis).substring(0, 200)
      });
    }
    if (smis.length < 5) {
      return Response.json({
        futuro: null,
        motivo: 'smisUltimos60 tiene menos de 5 valores. Longitud: ' + smis.length
      });
    }

    let velas = datos.velasUltimos60;
    if (typeof velas === 'string') {
      try {
        velas = JSON.parse(velas);
      } catch (e) {
        return Response.json({
          futuro: null,
          motivo: 'velasUltimos60 no parseable: ' + e.message
        });
      }
    }
    if (!Array.isArray(velas)) {
      return Response.json({
        futuro: null,
        motivo: 'velasUltimos60 no es array. Tipo: ' + typeof velas
      });
    }

    const smiActual = Number(datos.smiActual);
    if (isNaN(smiActual)) {
      return Response.json({
        futuro: null,
        motivo: 'smiActual no es número',
        valor: String(datos.smiActual)
      });
    }

    const validos = smis.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (validos.length < 2) {
      return Response.json({
        futuro: null,
        motivo: 'Menos de 2 valores válidos en smis. Válidos: ' + validos.length
      });
    }

    const ultimo = validos[validos.length - 1];
    const anterior = validos[validos.length - 2];
    const direccionActual =
      ultimo > anterior ? 'subiendo' : ultimo < anterior ? 'bajando' : 'plana';

    if (direccionActual === 'plana') {
      return Response.json({
        futuro: null,
        motivo: 'Dirección plana (último = anterior)',
        ultimo,
        anterior
      });
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
        },
        motivo: 'Sin casos encontrados. SMI actual: ' + smiActual + '. Dirección: ' + direccionActual
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
    return Response.json(
      { futuro: null, motivo: 'Excepción: ' + err.message },
      { status: 200 }
    );
  }
}
