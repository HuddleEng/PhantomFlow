@ECHO OFF

set CASPER_PATH=%~dp0libs\phantomcss\CasperJs
set CASPER_BIN=%CASPER_PATH%\bin\
set PHANTOMJS=%~dp0libs\phantomcss\PhantomJs\phantomjs.exe
set ARGV=%*
call "%PHANTOMJS%" "%CASPER_BIN%bootstrap.js" --casper-path="%CASPER_PATH%" --cli %ARGV%