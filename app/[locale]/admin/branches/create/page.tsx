'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2 } from 'lucide-react';

export default function CreateBranchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [error, setError] = useState('');
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

            const res = await fetch('/api/admin/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create branch');
            }

            router.push('/admin/branches');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const code = formData.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 4);
        setFormData({ ...formData, code });
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                });
                setGettingLocation(false);
            },
            (error) => {
                setError('Failed to get location. Please enable location services.');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

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
                    <h1 className="text-3xl font-bold text-gray-900">Create New Branch</h1>
                    <p className="text-gray-600 mt-2">Add a new franchise location</p>
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
                                    onBlur={generateCode}
                                    placeholder="e.g., Downtown Location, Mall Branch"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Branch Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch Code *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., DT, ML, MAIN"
                                        maxLength={10}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Auto-Generate
                                    </button>
                                </div>
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
                            Set the GPS coordinates for this branch. Employees must be within the specified radius to clock in.
                            If not set, employees can clock in from anywhere.
                        </p>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Latitude */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        placeholder="e.g., 31.9539"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Longitude */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        placeholder="e.g., 35.9106"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
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
                                {gettingLocation ? 'Getting location...' : 'Use Current Location'}
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
                                <p className="text-sm text-gray-500 mt-1">
                                    Employees must be within this distance to clock in (default: 200m)
                                </p>
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
                            {loading ? 'Creating...' : 'Create Branch'}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📌 What happens next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• The branch will be created and set as active</li>
                        <li>• You can assign employees to this branch from the Employees page</li>
                        <li>• Products and inventory will be branch-specific</li>
                        <li>• Branch admins will only see data from their assigned branch</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
