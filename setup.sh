#!/bin/bash

echo "🚀 Configurando Plantilla NestJS Backend..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor, instala npm primero."
    exit 1
fi

echo "✅ Node.js y npm están instalados"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cp env.example .env
    echo "✅ Archivo .env creado. Por favor, edítalo con tus configuraciones."
else
    echo "✅ Archivo .env ya existe"
fi

# Verificar si MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL no está instalado o no está en el PATH."
    echo "   Por favor, instala MySQL y asegúrate de que esté en ejecución."
    echo "   También puedes usar Docker: docker run --name mysql -e MYSQL_ROOT_PASSWORD= -e MYSQL_DATABASE=plantilla_nest_back -p 3306:3306 -d mysql:8.0"
else
    echo "✅ MySQL está instalado"
fi

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus configuraciones de base de datos"
echo "2. Crea la base de datos MySQL: plantilla_nest_back"
echo "3. Ejecuta: npm run start:dev"
echo "4. Visita: http://localhost:3000/api para ver la documentación"
echo ""
echo "📚 Para más información, consulta el README.md"
