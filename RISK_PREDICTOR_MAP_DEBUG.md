# Risk Predictor - Location Data Diagnostic

## 🔴 Problem: "No roads with location data available"

This message appears because the map needs **latitude/longitude coordinates** to plot road markers.

---

## ✅ How to Fix

### **Step 1: Check Your Complaint Data**

Run this query in your database to see the current state:

```sql
-- Check how many complaints have location data
SELECT 
  COUNT(*) as total_complaints,
  COUNT(latitude) as with_latitude,
  COUNT(longitude) as with_longitude,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_both_coords
FROM complaints;

-- See sample complaints with locations
SELECT id, road_id, latitude, longitude, address, created_at
FROM complaints
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 10;
```

### **Step 2: Check Road-Complaint Relationship**

```sql
-- See which roads have complaints
SELECT 
  r.id,
  r.road_name,
  COUNT(c.id) as complaint_count,
  SUM(CASE WHEN c.latitude IS NOT NULL THEN 1 ELSE 0 END) as complaints_with_coords
FROM roads r
LEFT JOIN complaints c ON r.id = c.road_id
GROUP BY r.id, r.road_name
HAVING COUNT(c.id) > 0
ORDER BY COUNT(c.id) DESC
LIMIT 20;
```

---

## 🔧 How to Add Location Data

### **Option A: Add to Complaints (Recommended)**

Make sure complaints are being created **with latitude/longitude**:

```typescript
// In your complaint creation endpoint
const complaint = await prisma.complaint.create({
  data: {
    road_id: roadId,
    latitude: parsedLat,      // ✅ Must have this
    longitude: parsedLng,     // ✅ Must have this
    issue_type: type,
    confidence: score,
    image_url: imageUrl,
    // ... other fields
  }
});
```

### **Option B: Geocode from Address**

If complaints have addresses but no coordinates, geocode them:

```typescript
// Update complaint with geocoded coordinates
const geocodeResult = await geocodeAddress(complaint.address);
await prisma.complaint.update({
  where: { id: complaint.id },
  data: {
    latitude: geocodeResult.latitude,
    longitude: geocodeResult.longitude,
  }
});
```

---

## 📊 Expected Output

Once you have coordinates, you should see:

```
Road Risk Map Dashboard
├─ All (1535)           ← Total roads
├─ Critical (X)         ← Roads with risk ≥ 80%
├─ High (X)             ← Roads with risk 60-79%
├─ Medium (X)           ← Roads with risk 40-59%
└─ Low (X)              ← Roads with risk < 40%

Interactive Map
├─ 🔴 Red circles      ← Critical risk roads
├─ 🟠 Orange circles   ← High risk roads
├─ 🟡 Yellow circles   ← Medium risk roads
└─ 🟢 Green circles    ← Low risk roads
```

---

## 🐛 Debugging

### Check API Response

Visit: `http://localhost:3000/api/risk/map-data`

Look for `latitude` and `longitude` fields:

```json
[
  {
    "id": "road_id",
    "road_name": "Pollachi road",
    "latitude": 10.632,      // ← Should have this
    "longitude": 76.988,     // ← Should have this
    "risk_percentage": 42,
    "urgency": "Medium",
    "complaint_count": 5
  }
]
```

If `latitude` is `null`, complaints don't have coordinates.

### Check Complaints Table

```sql
SELECT 
  id, 
  road_id, 
  latitude, 
  longitude, 
  address,
  created_at
FROM complaints
LIMIT 5;
```

---

## 🚀 Next Steps

1. **Verify complaint data** has latitude/longitude
2. **Update complaint endpoint** to include coordinates
3. **Refresh the page** to see map markers
4. **Click markers** to view risk breakdown

---

## 💡 Why This Matters

The map needs coordinates to:
- ✅ Plot road locations geographically
- ✅ Show risk distribution visually
- ✅ Enable location-based filtering
- ✅ Identify geographic clusters of high-risk roads

Without coordinates, the risk calculation still works (shown in stats), but the map visualization won't display any markers.

---

## 📝 Checklist

- [ ] Verify complaints have valid latitude/longitude
- [ ] Check that complaints are linked to roads (road_id not null)
- [ ] Confirm API response includes coordinates
- [ ] Refresh browser to reload map data
- [ ] Should see colored circles on map

Once coordinates are present, the Risk Predictor map will light up! 🎉
