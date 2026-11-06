/**
 * Extractor de metadatos EXIF, IPTC, XMP y geolocalización GPS para imágenes.
 * Utiliza ExifReader para lectura completa en el cliente.
 */
import ExifReader from 'exifreader';

/**
 * Extrae metadatos profundos de una imagen desde su ArrayBuffer o File
 * @param {ArrayBuffer} buffer
 * @returns {Promise<object>}
 */
export async function extractExifMetadata(buffer) {
  try {
    const tags = ExifReader.load(buffer, { expanded: true });
    const result = {
      available: false,
      camera: {},
      capture: {},
      gps: null,
      iptc: {},
      xmp: {},
      colorProfile: null,
      rawTagsCount: 0,
      hasSensitiveLocation: false,
      allTags: [],
    };

    if (!tags) return result;

    let totalTags = 0;
    const flatTags = [];

    // Función auxiliar para obtener valor textual seguro
    const getVal = (tag) => {
      if (!tag) return null;
      if (typeof tag === 'string' || typeof tag === 'number') return String(tag);
      if (tag.description !== undefined) return String(tag.description);
      if (tag.value !== undefined) {
        if (Array.isArray(tag.value)) return tag.value.join(', ');
        return String(tag.value);
      }
      return null;
    };

    // Procesar secciones expanded: exif, iptc, xmp, icc, file
    if (tags.exif) {
      for (const [key, val] of Object.entries(tags.exif)) {
        totalTags++;
        const textVal = getVal(val);
        flatTags.push({ category: 'EXIF', name: key, value: textVal || 'N/A' });
      }

      result.camera = {
        make: getVal(tags.exif.Make) || 'No especificado',
        model: getVal(tags.exif.Model) || 'No especificado',
        software: getVal(tags.exif.Software) || 'No disponible',
        lens: getVal(tags.exif.LensModel) || getVal(tags.exif.Lens) || 'No disponible',
        exposureTime: getVal(tags.exif.ExposureTime) || 'No disponible',
        fNumber: getVal(tags.exif.FNumber) || 'No disponible',
        iso: getVal(tags.exif.ISOSpeedRatings) || getVal(tags.exif.PhotographicSensitivity) || 'No disponible',
        focalLength: getVal(tags.exif.FocalLength) || 'No disponible',
        orientation: getVal(tags.exif.Orientation) || 'No disponible',
        flash: getVal(tags.exif.Flash) || 'No disponible',
      };

      result.capture = {
        dateTimeOriginal: getVal(tags.exif.DateTimeOriginal) || getVal(tags.exif.CreateDate) || 'No disponible',
        dateTimeDigitized: getVal(tags.exif.DateTimeDigitized) || 'No disponible',
        dateTimeModified: getVal(tags.exif.DateTime) || getVal(tags.exif.ModifyDate) || 'No disponible',
        width: getVal(tags.exif.PixelXDimension) || getVal(tags.exif['Image Width']) || 'No disponible',
        height: getVal(tags.exif.PixelYDimension) || getVal(tags.exif['Image Length']) || 'No disponible',
        colorSpace: getVal(tags.exif.ColorSpace) || 'No disponible',
      };
    }

    // Procesar GPS
    if (tags.gps) {
      const lat = tags.gps.Latitude;
      const lon = tags.gps.Longitude;
      const alt = tags.gps.Altitude !== undefined ? tags.gps.Altitude : null;

      if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
        result.gps = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          latitudeRef: getVal(tags.gps.GPSLatitudeRef) || '',
          longitudeRef: getVal(tags.gps.GPSLongitudeRef) || '',
          altitude: alt !== null ? `${alt} m` : 'No disponible',
          mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
          osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
          timestamp: getVal(tags.gps.GPSDateStamp) ? `${getVal(tags.gps.GPSDateStamp)} ${getVal(tags.gps.GPSTimeStamp) || ''}`.trim() : 'No disponible',
        };
        result.hasSensitiveLocation = true;
      }

      for (const [key, val] of Object.entries(tags.gps)) {
        totalTags++;
        flatTags.push({ category: 'GPS', name: key, value: getVal(val) || 'N/A' });
      }
    }

    // Procesar IPTC
    if (tags.iptc) {
      for (const [key, val] of Object.entries(tags.iptc)) {
        totalTags++;
        const textVal = getVal(val);
        flatTags.push({ category: 'IPTC', name: key, value: textVal || 'N/A' });
        result.iptc[key] = textVal;
      }
    }

    // Procesar XMP
    if (tags.xmp) {
      for (const [key, val] of Object.entries(tags.xmp)) {
        totalTags++;
        const textVal = getVal(val);
        flatTags.push({ category: 'XMP', name: key, value: textVal || 'N/A' });
        result.xmp[key] = textVal;
      }
    }

    // Procesar Perfil de Color ICC
    if (tags.icc) {
      const profileDesc = tags.icc['Profile Description'] ? getVal(tags.icc['Profile Description']) : null;
      const deviceModel = tags.icc['Device Model Description'] ? getVal(tags.icc['Device Model Description']) : null;
      result.colorProfile = profileDesc || deviceModel || 'Perfil ICC presente';
    }

    result.rawTagsCount = totalTags;
    result.allTags = flatTags;
    result.available = totalTags > 0;

    return result;
  } catch (err) {
    console.warn('Error leyendo metadatos EXIF:', err);
    return {
      available: false,
      error: 'No se encontraron metadatos EXIF compatibles en la estructura del archivo.',
      camera: {},
      capture: {},
      gps: null,
      iptc: {},
      xmp: {},
      allTags: [],
    };
  }
}
