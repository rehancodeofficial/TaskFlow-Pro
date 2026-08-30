'use client';

import Link from 'next/link';

export default function AuthForm({
  mode,
  title,
  subtitle,
  redirectUrl,
  alternateUrl,
}: {
  mode: 'sign-in' | 'sign-up';
  title: string;
  subtitle: string;
  redirectUrl: string;
  alternateUrl: string;
}) {
  const isSignIn = mode === 'sign-in';
  const actionHref = isSignIn ? '/login' : '/register';
  const alternateText = isSignIn ? 'Create an account' : 'Sign in';

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {title}
          </Link>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href={alternateUrl} className="font-medium text-indigo-600 hover:text-indigo-500">
            {alternateText}
          </Link>
        </p>
      </div>
    </div>
  );
}
