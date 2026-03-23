'use client';
import React from 'react';

interface PlanGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  currentFeatures?: Record<string, boolean>;
}

export function PlanGate({ feature, children, fallback, currentFeatures }: PlanGateProps) {
  const hasFeature = currentFeatures?.[feature] ?? false;

  if (!hasFeature) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
