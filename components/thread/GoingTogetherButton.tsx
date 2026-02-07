'use client';

import { useState, useEffect } from 'react';
import { PartyPopper, Check, Clock } from 'lucide-react';
import { updateGoingTogether } from '@/lib/firebase/firestore';
import type { GoingTogether } from '@/lib/types';

interface GoingTogetherButtonProps {
  threadId: string;
  currentUserId: string;
  otherUserId: string;
  goingTogether: GoingTogether;
  otherUserName: string;
  onMutualConfirm?: () => void;
}

/**
 * GoingTogetherButton - Toggle "Going Together" status with confetti celebration
 */
export function GoingTogetherButton({
  threadId,
  currentUserId,
  otherUserId,
  goingTogether,
  otherUserName,
  onMutualConfirm,
}: GoingTogetherButtonProps) {
  const [updating, setUpdating] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const userConfirmed = goingTogether[currentUserId] || false;
  const otherConfirmed = goingTogether[otherUserId] || false;
  const bothConfirmed = userConfirmed && otherConfirmed;

  // Trigger confetti when both confirm
  useEffect(() => {
    if (bothConfirmed && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      triggerConfetti();
      onMutualConfirm?.();
    }
  }, [bothConfirmed, hasTriggeredConfetti, onMutualConfirm]);

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      // Fire confetti from both sides
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    } catch (err) {
      console.error('Confetti failed:', err);
    }
  };

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await updateGoingTogether(threadId, currentUserId, !userConfirmed);
    } catch (err) {
      console.error('Failed to update going together:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Both confirmed - celebration state
  if (bothConfirmed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-500 to-primary-500 text-white rounded-lg font-medium shadow-lg">
        <PartyPopper size={18} className="animate-bounce" />
        <span>Going Together!</span>
      </div>
    );
  }

  // User confirmed, waiting for other
  if (userConfirmed && !otherConfirmed) {
    return (
      <button
        onClick={handleToggle}
        disabled={updating}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50"
      >
        <Clock size={18} />
        <span>Waiting for {otherUserName}...</span>
      </button>
    );
  }

  // Other confirmed, user hasn't
  if (!userConfirmed && otherConfirmed) {
    return (
      <button
        onClick={handleToggle}
        disabled={updating}
        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors disabled:opacity-50 animate-pulse"
      >
        <Check size={18} />
        <span>{otherUserName} wants to go together!</span>
      </button>
    );
  }

  // Neither confirmed
  return (
    <button
      onClick={handleToggle}
      disabled={updating}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
    >
      <PartyPopper size={18} />
      <span>{updating ? 'Updating...' : 'Going Together?'}</span>
    </button>
  );
}
