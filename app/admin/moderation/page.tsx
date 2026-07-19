'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Home,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Pencil,
} from 'lucide-react';

interface Listing {
  id: string;
  property_type: string;
  location: string;
  price: number;
  currency: string;
  area: number;
  rooms: number;
  description: string | null;
  photos: string[] | null;
  contact: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  owner: {
    id: string;
    email: string;
    phone: string | null;
    is_blocked: boolean;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const glassStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export default function ModerationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({ price: '', area: '', rooms: '', location: '', description: '' });

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/listings?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch listings');

      const data = await response.json();
      setListings(data.data.listings);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleApprove = async (listingId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve');
      }

      fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedListing) return;
    if (rejectReason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/listings/${selectedListing.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject');
      }

      setSelectedListing(null);
      setRejectReason('');
      fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (listing: Listing) => {
    setEditForm({
      price: listing.price != null ? String(listing.price) : '',
      area: listing.area != null ? String(listing.area) : '',
      rooms: listing.rooms != null ? String(listing.rooms) : '',
      location: listing.location || '',
      description: listing.description || '',
    });
    setEditListing(listing);
  };

  const handleSaveEdit = async () => {
    if (!editListing) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/properties/listings/${editListing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price: editForm.price === '' ? undefined : Number(editForm.price),
          area: editForm.area === '' ? undefined : Number(editForm.area),
          rooms: editForm.rooms === '' ? undefined : Number(editForm.rooms),
          location: editForm.location,
          description: editForm.description,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось сохранить');
      }
      setEditListing(null);
      fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">Pending</span>;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-white">Listing Moderation</h1>
        <p className="text-gray-400 mt-1">Review and moderate property listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-[#0A6045] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-200 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Listings */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-[#0A6045] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={glassStyle}>
          <Clock size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No listings to show</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl p-6" style={glassStyle}>
              <div className="flex flex-wrap gap-6">
                {/* Image */}
                <div className="relative w-48 h-32 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                  {listing.photos && listing.photos.length > 0 ? (
                    <Image
                      src={listing.photos[0]}
                      alt={listing.property_type}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home size={32} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {listing.property_type}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{listing.location}</span>
                      </div>
                    </div>
                    {getStatusBadge(listing.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-gray-500 text-xs">Price</span>
                      <p className="text-white font-medium">
                        {formatPrice(listing.price, listing.currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Area</span>
                      <p className="text-white font-medium">{listing.area} m2</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Rooms</span>
                      <p className="text-white font-medium">{listing.rooms}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Submitted</span>
                      <p className="text-white font-medium">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {listing.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {listing.description}
                    </p>
                  )}

                  {/* Owner Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-500" />
                      <span className="text-gray-400">{listing.owner.email}</span>
                      {listing.owner.is_blocked && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                          Blocked
                        </span>
                      )}
                    </div>
                    {listing.owner.phone && (
                      <span className="text-gray-500">{listing.owner.phone}</span>
                    )}
                  </div>

                  {listing.rejection_reason && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm">
                        <strong>Rejected:</strong> {listing.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {listing.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(listing.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => openEdit(listing)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-blue-500/80 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Pencil size={18} />
                      Изменить
                    </button>
                    <button
                      onClick={() => setSelectedListing(listing)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-400" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.total_pages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 transition-colors"
            >
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-4">Reject Listing</h3>
            <p className="text-gray-400 mb-4">
              Please provide a reason for rejecting this {selectedListing.property_type} listing.
            </p>
            <textarea
              placeholder="Rejection reason (min 10 characters)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045] mb-4 resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setSelectedListing(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || rejectReason.trim().length < 10}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal (moderator fixes a pending listing before approve) */}
      {editListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl p-6 w-full max-w-md mx-4" style={glassStyle}>
            <h3 className="text-lg font-semibold text-white mb-4">Изменить заявку</h3>
            <div className="space-y-3">
              <input placeholder="Локация" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Цена" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
                <input type="number" placeholder="Площадь" value={editForm.area} onChange={(e) => setEditForm((f) => ({ ...f, area: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
                <input type="number" placeholder="Комнаты" value={editForm.rooms} onChange={(e) => setEditForm((f) => ({ ...f, rooms: e.target.value }))} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
              </div>
              <textarea placeholder="Описание" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045] resize-none" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditListing(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">Отмена</button>
              <button onClick={handleSaveEdit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#0A6045] text-white hover:bg-[#0B6E4F] transition-colors disabled:opacity-50">{isSubmitting ? 'Сохраняем…' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
