@echo off
title IPIRNET - Demarrage
color 0A
echo.
echo ============================================
echo   IPIRNET - Gestion du Personnel
echo   Demarrage automatique
echo ============================================
echo.

:: ─── Step 1: Start XAMPP MariaDB ──────────────────
echo [1/3] Demarrage de XAMPP MariaDB...
sc start mysql 2>nul
net start mysql 2>nul

:: Try starting mysqld directly if not running as service
tasklist /FI "IMAGENAME eq mysqld.exe" 2>nul | find /I "mysqld.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo     MariaDB non demarree, lancement direct...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    echo     Attente 4 secondes...
    timeout /t 4 /nobreak >nul
) else (
    echo     MariaDB deja active!
)

:: ─── Step 2: Import database ──────────────────────
echo.
echo [2/3] Import de la base de donnees...

:: Try port 3307 first (XAMPP MariaDB default)
"C:\xampp\mysql\bin\mysql.exe" -u root --port=3307 --host=127.0.0.1 -e "SELECT 1" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     Connexion sur port 3307 OK
    "C:\xampp\mysql\bin\mysql.exe" -u root --port=3307 --host=127.0.0.1 < "database.sql"
    if %ERRORLEVEL% EQU 0 (
        echo     Base importee avec succes!
    ) else (
        echo     Base deja importee ou erreur ignoree.
    )
) else (
    :: Try port 3306
    "C:\xampp\mysql\bin\mysql.exe" -u root --port=3306 --host=127.0.0.1 -e "SELECT 1" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo     Connexion sur port 3306 OK
        "C:\xampp\mysql\bin\mysql.exe" -u root --port=3306 --host=127.0.0.1 < "database.sql"
        echo     Mise a jour du port dans db.js vers 3306...
        powershell -Command "(Get-Content db.js) -replace 'port:.*3307', 'port:     3306,' | Set-Content db.js"
    ) else (
        echo.
        echo     ERREUR: Impossible de se connecter a MariaDB/MySQL!
        echo     Veuillez demarrer MySQL depuis XAMPP Control Panel
        echo     puis relancer ce fichier.
        echo.
        pause
        exit /b 1
    )
)

:: ─── Step 3: Start Node.js server ─────────────────
echo.
echo [3/3] Demarrage du serveur Node.js...
echo.
echo     Serveur disponible sur: http://localhost:3000
echo.
echo     Pour arreter: fermer cette fenetre (Ctrl+C)
echo.
echo ============================================

:: Find node.exe and start server
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node server.js
) else (
    "C:\Program Files\nodejs\node.exe" server.js
)

pause
