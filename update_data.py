#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════
# RED GEODÉSICA INRA - ACTUALIZADOR DE DATOS CON GEOPANDAS
# ═══════════════════════════════════════════════════════════════

"""
Script para procesar el GeoPackage del INRA y generar datos para
la aplicación web de Red Geodésica INRA.

Uso:
    python3 update_data.py input.gpkg output/data.js

Requisitos:
    pip install geopandas pandas
"""

import sys
import json
import argparse
from pathlib import Path
import geopandas as gpd
import pandas as pd


def procesar_gpkg(ruta_gpkg: str, salida_js: str = "data.js") -> None:
    """
    Procesa un GeoPackage del INRA y genera archivo data.js

    Args:
        ruta_gpkg: Ruta al archivo GeoPackage
        salida_js: Ruta al archivo de salida data.js
    """

    print(f"📦 Leyendo GeoPackage: {ruta_gpkg}")

    try:
        # Leer GeoPackage
        gdf = gpd.read_file(ruta_gpkg)
        print(f"✅ Cargados {len(gdf)} puntos")
        print(f"📋 Columnas: {list(gdf.columns)}")

        # Proyectar a WGS84
        if gdf.crs != 'EPSG:4326':
            gdf = gdf.to_crs('EPSG:4326')
            print("🔄 Proyectado a WGS84")

        # Procesar datos
        datos = []
        for idx, row in gdf.iterrows():
            try:
                lon = row.geometry.x
                lat = row.geometry.y

                # Campos principales
                nombre = str(row.get('Nombre', f'Punto {idx}') or '').strip()
                proyecto = str(row.get('Proyecto', 'General') or '').strip()
                ubicacion = str(row.get('Ubicacion', '') or '').strip()
                altura_eli = str(row.get('Altura_Eli', '') or '').strip()

                # Descripción (buscar en múltiples columnas)
                descripcion = ''
                for col in ['Descripcio', 'descripcion', 'DESCRIPCION', 'Imagenes']:
                    if col in row and row[col] and str(row[col]) not in ['nan', 'NaN']:
                        desc_temp = str(row[col]).strip()
                        if desc_temp:
                            descripcion = desc_temp[:500]  # Limitar a 500 caracteres
                            break

                punto = {
                    'id': str(row.get('ID', idx) or idx),
                    'nombre': nombre or f'Punto {idx}',
                    'proyecto': proyecto or 'Sin clasificar',
                    'lat': float(lat),
                    'lon': float(lon),
                    'ubicacion': ubicacion,
                    'alturaEli': altura_eli[:10] if altura_eli else '',
                    'descripcion': descripcion
                }

                datos.append(punto)

            except Exception as e:
                print(f"⚠️  Error procesando punto {idx}: {e}")
                continue

        print(f"\n✅ Procesados: {len(datos)} puntos válidos")

        # Estadísticas
        proyectos = set(p['proyecto'] for p in datos if p['proyecto'])
        print(f"📊 Proyectos únicos: {len(proyectos)}")

        con_desc = sum(1 for p in datos if p['descripcion'])
        print(f"📝 Con descripción: {con_desc}/{len(datos)}")

        # Mostrar proyectos
        print("\n🏷️  Proyectos:")
        proyectos_sorted = sorted(
            [(p, sum(1 for d in datos if d['proyecto'] == p)) for p in proyectos],
            key=lambda x: x[1],
            reverse=True
        )
        for proy, count in proyectos_sorted[:10]:
            print(f"   {proy}: {count}")

        # Generar data.js
        print(f"\n💾 Generando: {salida_js}")

        contenido = "// ═══════════════════════════════════════════════════════════════\n"
        contenido += "// RED GEODÉSICA INRA - DATOS (GEOPANDAS GENERADO)\n"
        contenido += f"// {len(datos)} puntos geodésicos del INRA Bolivia\n"
        contenido += "// Generado automáticamente desde GeoPackage\n"
        contenido += "// ═══════════════════════════════════════════════════════════════\n\n"
        contenido += "window.DATA_INRA = "
        contenido += json.dumps(datos, ensure_ascii=False, indent=2)
        contenido += ";\n"

        Path(salida_js).parent.mkdir(parents=True, exist_ok=True)
        with open(salida_js, 'w', encoding='utf-8') as f:
            f.write(contenido)

        print(f"✅ Archivo creado: {salida_js}")
        print(f"✅ Tamaño: {len(contenido) / 1024:.1f} KB")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def analizar_gpkg(ruta_gpkg: str) -> None:
    """
    Analiza un GeoPackage y muestra información detallada

    Args:
        ruta_gpkg: Ruta al archivo GeoPackage
    """

    print(f"🔍 ANÁLISIS DE GEOPACKAGE: {ruta_gpkg}\n")

    try:
        gdf = gpd.read_file(ruta_gpkg)

        print(f"📊 Total de puntos: {len(gdf)}")
        print(f"📍 CRS: {gdf.crs}")
        print(f"📐 Tipo de geometría: {gdf.geometry.type.unique()}")

        print(f"\n📋 COLUMNAS ({len(gdf.columns)}):")
        for col in gdf.columns:
            if col != 'geometry':
                no_null = gdf[col].notna().sum()
                porcentaje = (no_null / len(gdf)) * 100
                print(f"   {col}: {no_null}/{len(gdf)} ({porcentaje:.1f}%)")

        print(f"\n📈 ESTADÍSTICAS GEOGRÁFICAS:")
        bounds = gdf.geometry.bounds
        print(f"   Latitud: {bounds['miny'].min():.4f} a {bounds['maxy'].max():.4f}")
        print(f"   Longitud: {bounds['minx'].min():.4f} a {bounds['maxx'].max():.4f}")

        # Ejemplo de datos
        print(f"\n🎯 EJEMPLO DE PUNTO:")
        primer = gdf.iloc[0]
        for col in gdf.columns[:5]:
            print(f"   {col}: {primer[col]}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Procesa GeoPackage del INRA para Red Geodésica'
    )

    subparsers = parser.add_subparsers(dest='comando', help='Comando')

    # Procesar
    parser_proc = subparsers.add_parser('procesar', help='Procesar GeoPackage')
    parser_proc.add_argument('gpkg', help='Archivo GeoPackage de entrada')
    parser_proc.add_argument('-o', '--output', default='data.js', help='Archivo data.js de salida')

    # Analizar
    parser_anal = subparsers.add_parser('analizar', help='Analizar GeoPackage')
    parser_anal.add_argument('gpkg', help='Archivo GeoPackage a analizar')

    args = parser.parse_args()

    if args.comando == 'procesar':
        procesar_gpkg(args.gpkg, args.output)
    elif args.comando == 'analizar':
        analizar_gpkg(args.gpkg)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
