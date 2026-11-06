/**
 * Motor de cálculo de Hash Perceptual (dHash / aHash) para comparación visual de imágenes.
 * Determina si dos imágenes son visualmente idénticas o similares incluso con diferente compresión,
 * tamaño o metadatos. Toda la operación se realiza en Canvas local.
 */

/**
 * Calcula el hash de diferencia perceptual (dHash) de una imagen (64 bits).
 * @param {File|Blob|string} imageSource
 * @returns {Promise<{hash: string, binary: string, error?: string}>}
 */
export async function computeImagePerceptualHash(imageSource) {
  return new Promise((resolve) => {
    let objectUrl = null;
    let src = '';

    if (typeof imageSource === 'string') {
      src = imageSource;
    } else {
      objectUrl = URL.createObjectURL(imageSource);
      src = objectUrl;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        // Redimensionar a 9 columnas por 8 filas para dHash (64 comparaciones horizontales)
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          cleanup();
          return resolve({ hash: null, binary: null, error: 'Contexto Canvas 2D no disponible' });
        }

        ctx.drawImage(img, 0, 0, 9, 8);
        const imgData = ctx.getImageData(0, 0, 9, 8).data;

        // Convertir a escala de grises
        const grays = [];
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          // Fórmula ITU-R BT.601
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          grays.push(gray);
        }

        // Comparar pixel izquierdo vs derecho
        let binary = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const left = grays[row * 9 + col];
            const right = grays[row * 9 + col + 1];
            binary += left > right ? '1' : '0';
          }
        }

        // Convertir string de 64 bits a 16 caracteres hexadecimales
        let hex = '';
        for (let i = 0; i < binary.length; i += 4) {
          const nibble = binary.substring(i, i + 4);
          hex += parseInt(nibble, 2).toString(16);
        }

        cleanup();
        resolve({
          hash: hex.toUpperCase(),
          binary,
        });
      } catch (err) {
        cleanup();
        resolve({ hash: null, binary: null, error: err.message });
      }
    };

    img.onerror = () => {
      cleanup();
      resolve({ hash: null, binary: null, error: 'No se pudo decodificar el archivo como imagen.' });
    };

    img.src = src;
  });
}

/**
 * Calcula la distancia de Hamming entre dos hashes binarios de 64 bits.
 * @param {string} hash1
 * @param {string} hash2
 * @returns {{distance: number, similarityPercentage: number}}
 */
export function comparePerceptualHashes(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return { distance: 64, similarityPercentage: 0 };
  }

  // Convertir hashes hex a binario si es necesario
  let bin1 = '';
  let bin2 = '';

  for (let i = 0; i < hash1.length; i++) {
    bin1 += parseInt(hash1[i], 16).toString(2).padStart(4, '0');
    bin2 += parseInt(hash2[i], 16).toString(2).padStart(4, '0');
  }

  let distance = 0;
  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) {
      distance++;
    }
  }

  // Porcentaje de similitud: (64 - distancia) / 64 * 100
  const maxBits = bin1.length;
  const similarityPercentage = parseFloat((((maxBits - distance) / maxBits) * 100).toFixed(2));

  return {
    distance,
    similarityPercentage,
    isVisuallyIdentical: distance === 0,
    isHighlySimilar: distance <= 5, // <= 5 bits de diferencia se considera prácticamente idéntica visualmente
  };
}
