'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MapPin, Loader2, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { parseGoogleMapsUrl, formatCoordinates, Coordinates } from '@/lib/googleMapsParser';

export default function EditBranchPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [fetchingLoading, setFetchingLoading] = useState(true);
    const [error, setError] = useState('');
    const [googleMapsLink, setGoogleMapsLink] = useState('');
    const [parsedCoords, setParsedCoords] = useState<Coordinates | null>(null);
    const [linkError, setLinkError] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        latitude: '',
        longitude: '',
        geoRadius: '200',
    });

    useEffect(() => {
        if (id) {
            fetchBranch();
        }
    }, [id]);

    const fetchBranch = async () => {
        try {
            const res = await fetch(`/api/admin/branches/${id}`);
            if (!res.ok) throw new Error('Failed to fetch branch');
            const data = await res.json();

            const lat = data.latitude !== null ? data.latitude.toString() : '';
            const lng = data.longitude !== null ? data.longitude.toString() : '';

            setFormData({
                name: data.name,
                code: data.code,
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                latitude: lat,
                longitude: lng,
                geoRadius: data.geoRadius ? data.geoRadius.toString() : '200',
            });

            if (lat && lng) {
                const coords = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
                setParsedCoords(coords);
                setGoogleMapsLink(`https://maps.google.com/?q=${lat},${lng}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFetchingLoading(false);
        }
    };

    // Handle Google Maps link input
    const handleGoogleMapsLink = async (value: string) => {
        setGoogleMapsLink(value);
        setLinkError('');

        if (!value.trim()) {
            setParsedCoords(null);
            setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
            return;
        }

        // Check if it's a short link that needs expansion
        let urlToParse = value;
        if (value.includes('goo.gl') || value.includes('g.page') || value.includes('maps.app.goo.gl')) {
            try {
                const res = await fetch(`/api/admin/maps/expand?url=${encodeURIComponent(value)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.expandedUrl) {
                        urlToParse = data.expandedUrl;
                    }
                }
            } catch (error) {
                console.error('Failed to expand URL:', error);
                // Continue with original URL if expansion fails
            }
        }

        const coords = parseGoogleMapsUrl(urlToParse);
        if (coords) {
            setParsedCoords(coords);
            setFormData(prev => ({
                ...prev,
                latitude: coords.latitude.toFixed(6),
                longitude: coords.longitude.toFixed(6)
            }));
            setLinkError('');
        } else {
            setParsedCoords(null);
            setLinkError('Could not extract coordinates from this link. Please paste a valid Google Maps link.');
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));
                setParsedCoords({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
                setGoogleMapsLink(`https://maps.google.com/?q=${lat},${lng}`);
                setGettingLocation(false);
            },
            (error) => {
                setError('Failed to get location. Please enable location services.');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                geoRadius: formData.geoRadius ? parseFloat(formData.geoRadius) : 200,
            };

            const res = await fetch(`/api/admin/branches/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update branch');
            }

            router.push('/admin/branches');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading branch...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                    >
                        ← Back to Branches
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Branch</h1>
                    <p className="text-gray-600 mt-2">Update branch information</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

                        <div className="space-y-4">
                            {/* Branch Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Downtown Location, Mall Branch"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Branch Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., DT, ML, MAIN"
                                    maxLength={10}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Short unique code for this branch (2-10 characters)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>

                        <div className="space-y-4">
                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address of the branch"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+962 X XXX XXXX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="branch@althawaq.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Geolocation Settings */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Clock-In Location
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Paste a Google Maps link for this branch location. Employees must be within the specified radius to clock in.
                        </p>

                        <div className="space-y-4">
                            {/* Google Maps Link Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <LinkIcon className="w-4 h-4 inline mr-1" />
                                    Google Maps Link
                                </label>
                                <input
                                    type="url"
                                    value={googleMapsLink}
                                    onChange={(e) => handleGoogleMapsLink(e.target.value)}
                                    placeholder="Paste Google Maps link here (e.g., https://maps.google.com/?q=31.9539,35.9106)"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${linkError ? 'border-red-300 bg-red-50' : parsedCoords ? 'border-green-300 bg-green-50' : 'border-gray-300'
                                        }`}
                                />
                                {linkError && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {linkError}
                                    </p>
                                )}
                                {parsedCoords && (
                                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                        <Check className="w-4 h-4" />
                                        Coordinates detected: {formatCoordinates(parsedCoords)}
                                    </p>
                                )}
                            </div>

                            {/* Use Current Location Button */}
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={gettingLocation}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                {gettingLocation ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MapPin className="w-4 h-4" />
                                )}
                                {gettingLocation ? 'Getting location...' : 'Or Use Current Location'}
                            </button>

                            {/* Radius */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Allowed Radius (meters)
                                </label>
                                <input
                                    type="number"
                                    value={formData.geoRadius}
                                    onChange={(e) => setFormData({ ...formData, geoRadius: e.target.value })}
                                    placeholder="200"
                                    min="50"
                                    max="1000"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? 'Updating...' : 'Update Branch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
