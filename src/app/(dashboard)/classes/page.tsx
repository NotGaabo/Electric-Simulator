'use client'

import { useClassroom } from '@/hooks/useClassroom'

export default function ClassroomDashboard() {
  const {
      classes,
      fetchingClasses,
      getColorForClass,
      router,
      getTeacherInitials,
      getTeacherName,
      formatDate,
      deleteClass,
      fetchClasses
  } = useClassroom() 

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Clases</h1>
          <button
            onClick={fetchClasses}
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
            disabled={fetchingClasses}
          >
            {fetchingClasses ? 'Cargando...' : 'Recargar'}
          </button>
        </div>

        {fetchingClasses && classes.length === 0 ? (
          <div className="p-10 text-center text-gray-600">Cargando clases...</div>
        ) : classes.length === 0 ? (
          <div className="p-10 text-center text-gray-600">No tienes clases aún.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                onClick={() => router.push(`/classes/${classItem.id}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className={`h-32 bg-gradient-to-br ${getColorForClass(classItem.id)} p-5 relative`}>
                  <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">
                    {classItem.name}
                  </h3>
                  <p className="text-white/90 text-sm line-clamp-1">
                    {classItem.description || 'Sin descripción'}
                  </p>

                  <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-semibold">
                    {getTeacherInitials(classItem)}
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">{getTeacherName(classItem)}</p>
                  <p className="text-xs text-gray-400">Creado el {formatDate(classItem.created_at)}</p>
                  {classItem.code && (
                    <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                      Código: {classItem.code}
                    </p>
                  )}
                </div>

                <div className="px-4 pb-4 border-t border-gray-100 pt-3 flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/classes/${classItem.id}/students`)
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Ver estudiantes"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Estudiantes
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteClass(classItem.id, classItem.name)
                    }}
                    className="p-2 rounded-full hover:bg-red-50"
                    title="Eliminar clase"
                  >
                    <svg className="w-5 h-5 text-gray-600 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
