import React from 'react';

export default function RynekPage() {
    return (
        <main className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Recyklat <span className="text-blue-600">B2B</span>
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Ogólnopolska giełda surowców wtórnych i odpadów
                    </p>
                </header>

                <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">
                        System działa!
                    </h2>
                    <p className="text-gray-600">
                        Jesteś na nowej podstronie <strong>/rynek</strong>.
                    </p>
                </div>
            </div>
        </main>
    );
}