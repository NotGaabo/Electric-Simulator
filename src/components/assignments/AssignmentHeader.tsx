'use client'

import { useRouter } from 'next/navigation'

interface Props {
  isOnline: boolean
}

export default function AssignmentHeader({ isOnline }: Props) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between pb-4">
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2.5 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-sm"
      >
        <svg
          className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold text-sm">Trabajo de clase</span>
      </button>

      <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          {isOnline && (
            <>
              <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
              <div className="absolute w-3 h-3 rounded-full bg-green-500 opacity-30 animate-pulse"></div>
            </>
          )}
        </div>
        <span className={`text-sm font-medium ${
          isOnline ? 'text-green-700' : 'text-gray-600'
        }`}>
          {isOnline ? 'En vivo' : 'Sin conexión'}
        </span>
      </div>
    </div>
  )
}