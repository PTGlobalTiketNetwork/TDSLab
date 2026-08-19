# Implementasi Cancel Generation (AI Prediction)

Dokumen ini menjelaskan pola arsitektur **Two-Layer Cancellation** untuk menghentikan proses generasi AI (Long-Polling) secara efektif. Pola ini dirancang untuk segera menghentikan aktivitas klien dan meminta server provider (Replicate) membatalkan komputasi.

## Arsitektur

Proses pembatalan terjadi dalam dua lapisan simultan:
1.  **Frontend (Immediate Abort):** Menghentikan *polling loop* secara instan menggunakan `useRef`.
2.  **Backend (API Termination):** Mengirim sinyal ke AI Provider untuk menghentikan penggunaan GPU/billing.

---

## 1. Frontend Implementation (React)

Tantangan utama pada React adalah *closure* di dalam `while` loop. State (`useState`) seringkali tidak terupdate di dalam loop yang sedang berjalan. Solusinya adalah menggunakan `useRef`.

### State Management
```typescript
const isCancelledRef = useRef(false); // Mutable flag untuk memutus loop
const [isCancelling, setIsCancelling] = useState(false); // Untuk feedback UI
const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
```

### Logic Pembatalan
```typescript
const handleCancelGeneration = async () => {
    // 1. Set flag untuk menghentikan polling loop di klien SEGERA
    isCancelledRef.current = true; 
    setIsCancelling(true);

    // 2. Request ke server untuk mematikan proses di provider (Replicate)
    if (currentPredictionId) {
        try {
            await fetch(`${SERVER_URL}/cancel-prediction/${currentPredictionId}`, {
                method: 'POST',
                headers: { ... }
            });
        } catch (error) {
            console.error("Gagal membatalkan di server:", error);
        }
    }

    // 3. Reset UI State
    setIsGenerating(false);
    setIsCancelling(false);
};
```

### Polling Loop (Critical Logic)
Di dalam fungsi `handleGenerate` atau polling loop, pengecekan `ref` harus dilakukan di setiap iterasi.

```typescript
const handleGenerate = async () => {
    isCancelledRef.current = false; // Reset flag saat mulai
    
    // ... Start Generation request ...
    const predictionId = response.id;
    setCurrentPredictionId(predictionId);

    while (status !== 'succeeded' && status !== 'failed') {
        // [CHECKPOINT] Cek apakah user menekan Cancel?
        if (isCancelledRef.current) {
            console.log('Loop dihentikan manual oleh user');
            return; // Keluar dari fungsi total
        }

        await new Promise(r => setTimeout(r, 3000));
        // ... Lanjut polling status ...
    }
};
```

---

## 2. Backend Implementation (Hono/Node)

Endpoint ini berfungsi sebagai proxy aman untuk memanggil API cancel dari provider (misal: Replicate) tanpa mengekspos API Key di frontend.

### Endpoint Definition
`POST /cancel-prediction/:id`

### Implementation
```typescript
app.post('/cancel-prediction/:id', async (c) => {
    const predictionId = c.req.param("id");
    
    // Call Provider API (Example: Replicate)
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
        method: "POST",
        headers: {
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        return c.json({ error: "Gagal membatalkan di provider" }, 500);
    }

    return c.json({ success: true });
});
```

## Ringkasan Alur UX
1. User klik **"Generate"** → Loop polling mulai berjalan.
2. User klik **"Cancel"** →
   - UI berubah menjadi "Cancelling...".
   - `isCancelledRef.current` menjadi `true`.
   - Iterasi loop berikutnya mendeteksi `true` dan berhenti (`return`).
   - *Background request* dikirim ke server untuk menghentikan GPU.
3. UI kembali ke status siap (idle).
