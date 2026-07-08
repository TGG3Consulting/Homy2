'use client';

import { useParams } from 'next/navigation';
import PropertyDetailView from '@/components/homy/PropertyDetailView';

export default function PropertyPage() {
  const params = useParams();
  const propertyId = params.id as string;
  return <PropertyDetailView propertyId={propertyId} mode="page" />;
}
