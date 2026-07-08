'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import { Review, ReviewStats, ReviewsResponse } from '@/lib/types';

interface ReviewSectionProps {
  propertyId: string;
  currentUserId?: string | null;
}

export default function ReviewSection({
  propertyId,
  currentUserId,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Find current user's review
  const userReview = reviews.find((r) => r.user_id === currentUserId);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/properties/${propertyId}/reviews?page=${page}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data: ReviewsResponse = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to load reviews');
      console.error('Fetch reviews error:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formRating === 0) {
      setFormError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const response = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: formRating,
          comment: formComment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // Reset form and refresh reviews
      setFormRating(0);
      setFormComment('');
      setShowForm(false);
      setPage(1);
      fetchReviews();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (editRating === 0) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update review');
      }

      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      console.error('Update review error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete review');
      }

      fetchReviews();
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const anonymizeEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}${username[1]}***@${domain}`;
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>

      {/* Stats Summary */}
      {stats && (
        <div className="flex items-center gap-6 mb-6 p-4 bg-emerald-50 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-emerald-600">
              {stats.averageRating.toFixed(1)}
            </span>
            <StarRating value={stats.averageRating} readonly size="sm" />
            <span className="text-sm text-gray-500 mt-1">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-600">{rating}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button / Form */}
      {isAuthenticated && !userReview && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <form onSubmit={handleSubmitReview} className="bg-white border rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3">Your Review</h4>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Rating</label>
                <StarRating value={formRating} onChange={setFormRating} size="lg" />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Share your experience with this property..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={2000}
                />
                <div className="text-xs text-gray-400 text-right mt-1">
                  {formComment.length}/2000
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormRating(0);
                    setFormComment('');
                    setFormError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Login prompt for unauthenticated users */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">
            <a href="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </a>{' '}
            to write a review
          </p>
        </div>
      )}

      {/* Reviews List */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this property!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-xl p-4 ${
                review.user_id === currentUserId ? 'border-emerald-200 bg-emerald-50/50' : ''
              }`}
            >
              {editingReviewId === review.id ? (
                // Edit mode
                <div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-2">Rating</label>
                    <StarRating value={editRating} onChange={setEditRating} size="md" />
                  </div>

                  <div className="mb-3">
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateReview(review.id)}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating value={review.rating} readonly size="sm" />
                        <span className="text-sm font-medium text-gray-900">
                          {review.rating}/5
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.user?.email ? anonymizeEmail(review.user.email) : 'Anonymous'}
                        {review.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-emerald-600 font-medium">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.created_at)}
                      {review.updated_at && review.updated_at !== review.created_at && (
                        <span className="ml-1">(edited)</span>
                      )}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.comment}</p>
                  )}

                  {/* Edit/Delete buttons for own reviews */}
                  {review.user_id === currentUserId && isAuthenticated && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => startEditing(review)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
