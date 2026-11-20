import React, { useState } from 'react';

type ProfileAvatarProps = {
  src?: string;
  userId?: string;
  alt?: string;
  className?: string;
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ src, alt = '', className = '' }) => {
  const fallback = '/avatars/profile_fallback.svg';
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const requested = src?.trim() || fallback;
  const image = !failedSources.includes(requested) ? requested
    : !failedSources.includes(fallback) ? fallback : '/avatars/profile_fallback.svg';

  return (
    <img
      src={image}
      alt={alt}
      onError={() => setFailedSources((sources) => sources.includes(image) ? sources : [...sources, image])}
      className={`${className} object-cover`}
      style={{ objectPosition: 'center' }}
    />
  );
};
