# Especificación oficial del motor de cálculo — V3

Este documento es la referencia vinculante para el motor de autogeneración.

## 1. Indicador propietario (SMI)

Variante del Stochastic Momentum Index de William Blau.

### 1.1. Parámetros

- length_k = 10
- length_d = 3
- smooth_period = 5
- ema_signal_len = 10 (no usada)
- Rango: -100 a +100 (clipado)
- Epsilon anti-división: 1e-9

### 1.2. Fórmula

hh = high.rolling(10).max()
ll = low.rolling(10).min()
diff = hh - ll
rdiff = close - (hh + ll) / 2

avgrel = rdiff.ewm(span=3, adjust=False).mean()
avgdiff = diff.ewm(span=3, adjust=False).mean()

smi_raw = (avgrel / (avgdiff / 2 + 1e-9)) * 100
smi_raw = np.clip(smi_raw, -100, 100)

SMI = smi_raw.rolling(5).mean()

El valor publicado es SMI (suavizado con SMA de 5).

### 1.3. Temporalidades

- SMI diario: velas diarias, period="90d", interval="1d"
- SMI semanal: velas semanales, period="1y", interval="1wk"

## 2. Zonas

- Zona alta: SMI > 40
- Zona intermedia: -40 <= SMI <= 40
- Zona baja: SMI < -40

Prohibido en la web: "sobrecompra", "sobreventa".

## 3. Señales

### 3.1. Compra (entrada)

En la vela i (empezando en i=2):

- pendiente[i] > 0
- pendiente[i-1] <= 0
- SMI[i-1] < 40
- Sin posición abierta

Ejecución: precio de cierre de la vela i-1.

### 3.2. Venta (salida)

En la vela i:

- pendiente[i] < 0
- pendiente[i-1] >= 0
- Con posición abierta

Ejecución: precio de cierre de la vela i-1.

### 3.3. Capital por operación

10.000 EUR constante. Nº acciones = 10.000 / precio_compra.

## 4. Nivel de riesgo

Base: SMI semanal.

- Dirección diaria alcista y SMI semanal > 40: riesgo alto.
- Dirección diaria bajista y SMI semanal < -40: riesgo alto.
- Resto: medio o bajo según zona.

En V3 se traduce a "nivel de riesgo calculado" con color.

## 5. Estadística histórica

- Horizonte: 10 días siguientes a cada señal.
- Señales usadas: compra y venta.
- Histórico: 1 año de velas diarias.
- Métricas: nº de señales, % subida a 10 días, % bajada a 10 días, variación media.
- Aviso si muestra < 10: "Muestra limitada. Interpretar con cautela".

## 6. Fuente de datos

- Yahoo Finance vía yfinance.
- Diario: 90 días.
- Semanal: 1 año.
- Solo OHLCV estándar.

## 7. Elementos prohibidos (eliminados del V3)

- Recomendaciones de compra/venta.
- Precio objetivo / target.
- Proyección lineal de precio.
- Lenguaje direccional.
- Palabras "sobrecompra" / "sobreventa".
- Término "SMI" en la web.

## 8. Casos de prueba

Pendiente de añadir con datos reales.

## 9. Referencia legal

Este documento se subordina a las reglas del Paso 1.
