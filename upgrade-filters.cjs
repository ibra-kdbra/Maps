const fs = require('fs');

const data = JSON.parse(fs.readFileSync('backend/data/syria-style.json', 'utf8'));

function convertLegacyFilter(filter) {
  if (!Array.isArray(filter) || filter.length === 0) return filter;

  const op = filter[0];

  // Compound filters
  if (op === 'all' || op === 'any') {
    return [op, ...filter.slice(1).map(convertLegacyFilter)];
  }
  if (op === 'none') {
    return ['!', ['any', ...filter.slice(1).map(convertLegacyFilter)]];
  }
  if (op === '!') {
    return ['!', convertLegacyFilter(filter[1])];
  }

  // Legacy in / !in
  if (op === 'in' || op === '!in') {
    const key = filter[1];
    const values = filter.slice(2);
    // Convert to MapLibre v8 expression: ["match", ["get", key], [values], true, false]
    const keyExpr = (key === '$type' || key === '$id') ? ["id"] : ["get", key];
    // wait, if key is $type, it is ["geometry-type"]
    const getExpr = key === '$type' ? ["geometry-type"] : key === '$id' ? ["id"] : ["get", key];
    
    // For 'in', it matches any of the values.
    const matchExpr = ["match", getExpr, values, true, false];
    
    return op === 'in' ? matchExpr : ["!", matchExpr];
  }

  // Legacy comparison
  if (['==', '!=', '>', '>=', '<', '<='].includes(op)) {
    const key = filter[1];
    const val = filter[2];
    const getExpr = key === '$type' ? ["geometry-type"] : key === '$id' ? ["id"] : ["get", key];
    return [op, getExpr, val];
  }

  // Legacy has / !has
  if (op === 'has' || op === '!has') {
    const key = filter[1];
    const getExpr = key === '$type' ? ["geometry-type"] : key === '$id' ? ["id"] : ["has", key];
    if (key === '$type' || key === '$id') {
      // 'has $type' or 'has $id' is always true in vector tiles usually
      return op === 'has' ? true : false;
    }
    return op === 'has' ? getExpr : ["!", getExpr];
  }

  // If it's already a v8 expression, just return it
  return filter;
}

if (data.layers) {
  data.layers.forEach(layer => {
    if (layer.filter) {
      layer.filter = convertLegacyFilter(layer.filter);
    }
  });
}

fs.writeFileSync('backend/data/syria-style.json', JSON.stringify(data, null, 2));
console.log('Successfully upgraded legacy filters to standard v8 expressions!');
