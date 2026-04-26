'use client';
// components/property/PropertyForm.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Property } from '@/lib/types';
import { createProperty, updateProperty } from '@/services/property';

interface PropertyFormProps {
  landlordId: string;
  landlordName: string;
  existing?: Property;
  onSuccess: () => void;
  onCancel: () => void;
  adminOverride?: { featured?: boolean };
}

export default function PropertyForm({
  landlordId, landlordName, existing, onSuccess, onCancel, adminOverride,
}: PropertyFormProps) {
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [price, setPrice] = useState(existing?.price?.toString() || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [bedrooms, setBedrooms] = useState(existing?.bedrooms?.toString() || '0');
  const [bathrooms, setBathrooms] = useState(existing?.bathrooms?.toString() || '1');
  const [sqft, setSqft] = useState(existing?.sqft?.toString() || '');
  const [furnished, setFurnished] = useState(existing?.furnished || 'unfurnished');
  const [availableFrom, setAvailableFrom] = useState(existing?.availableFrom || '');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(existing?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImageFiles(prev => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 8,
  });

  const removeImage = (idx: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !price || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const data: Omit<Property, 'id' | 'createdAt'> = {
        title,
        description,
        price: Number(price),
        location,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: sqft ? Number(sqft) : undefined,
        furnished: furnished as Property['furnished'],
        availableFrom,
        images: existing?.images || [],
        landlordId,
        landlordName,
        status: 'active',
...(existing?.badge ? { badge: existing.badge } : {}),
...(adminOverride ?? {}),
      };

      if (existing?.id) {
        await updateProperty(existing.id, data, imageFiles);
      } else {
        await createProperty(data, imageFiles);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: '#fce4ec', border: '1px solid #e57373', color: '#c62828',
          padding: '12px 16px', borderRadius: 4, marginBottom: 20, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="form-group">
            <label className="form-label">Property Title *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Modern 2-Bed Apartment in Central Leeds" required />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the property, features, nearby amenities..." required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Monthly Rent (£) *</label>
          <input className="form-input" type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="1500" min="0" required />
        </div>

        <div className="form-group">
          <label className="form-label">Location *</label>
          <input className="form-input" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Leeds City Centre, LS1" required />
        </div>

        <div className="form-group">
          <label className="form-label">Bedrooms</label>
          <select className="form-select" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            <option value="0">Studio</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Bathrooms</label>
          <select className="form-select" value={bathrooms} onChange={e => setBathrooms(e.target.value)}>
            <option value="1">1 Bathroom</option>
            <option value="2">2 Bathrooms</option>
            <option value="3">3 Bathrooms</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Size (sqft)</label>
          <input className="form-input" type="number" value={sqft} onChange={e => setSqft(e.target.value)}
            placeholder="e.g. 750" min="0" />
        </div>

        <div className="form-group">
          <label className="form-label">Furnishing</label>
          <select className="form-select" value={furnished} onChange={e => setFurnished(e.target.value as "furnished" | "unfurnished" | "part-furnished")}
            <option value="furnished">Furnished</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="part-furnished">Part Furnished</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Available From</label>
          <input className="form-input" type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
        </div>
      </div>

      {/* Image Upload */}
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Property Images</label>
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--red)' : 'var(--gray-200)'}`,
            borderRadius: 8, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? '#fff5f5' : 'var(--gray-100)',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 4 }}>
            {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Up to 8 images, JPG/PNG/WebP</div>
        </div>

        {previews.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', height: 100, borderRadius: 4, overflow: 'hidden' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '13px 32px', background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : existing ? 'Update Property' : 'Publish Listing'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '13px 32px', background: 'transparent', color: 'var(--black)',
            border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
