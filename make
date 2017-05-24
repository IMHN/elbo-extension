#!/bin/bash

# General functions

function esc() {
	local length=${#1}
	local rv
	local i

	for ((i = 0; i < length; i++)); do
		char=${1:i:1}

		if [[ $char == '\' || $char == '{' || $char == '}' ]]; then
			rv="$rv\\"
		fi

		rv="$rv$char"
	done

	echo -n "$rv"
}

function print() {
	if [[ -t 1 ]]; then
		echo "$1" | sed -r 's/bold\{((\\.|[^}\\])+)\}/\x1b[1m\1\x1b[0m/g;s/info\{((\\.|[^}\\])+)\}/\x1b[32m\1\x1b[0m/g;s/comment\{((\\.|[^}\\])+)\}/\x1b[36m\1\x1b[0m/g;s/error\{((\\.|[^}\\])+)\}/\x1b[31m\1\x1b[0m/g;s/warn\{((\\.|[^}\\])+)\}/\x1b[33m\1\x1b[0m/g;s/link\{((\\.|[^}\\])+)\}/\x1b[34m\x1b[4m\1\x1b[0m/g;s/\\(.)/\1/g'
	else
		echo "$1" | sed -r 's/(bold|info|comment|error|warn|link)\{((\\.|[^}\\])+)\}/\2/g;s/\\(.)/\1/g'
	fi
}

# Constants

file_list=("css" "fonts" "img" "js" "manifest.json" "popup.html" "README.md")

# Packaging-specific functions

function get_version() {
	sed -nr '/"version"/ s/.*\"([^"]+)".*/\1/p' manifest.json
}

function get_chrome_command() {
	which chromium-browser || which google-chrome
}

function generate_chrome_package() {
	print "info{Building Chrome upload package}"
	filename="build/elbo-extension-$(get_version)-chrome.zip"

	if [[ -e $filename ]]; then
		rm "$filename"
	fi

	mkdir -p build

	print "  comment{Creating ZIP archive}"
	zip -r "$filename" "${file_list[@]}"
}

function generate_opera_package() {
	print "info{Building Opera upload package}"
	local dirname="build/elbo-extension-$(get_version)-opera"

	rm -rf "$dirname"*

	mkdir -p "$dirname"

	print "  comment{Copying files}"
	cp -r "${file_list[@]}" "$dirname"

	print "  comment{Building CRX package}"

	if ! local chrome="$(get_chrome_command)"; then
		print "error{Failed to find an installation of Chromium/Google Chrome.}"
		return 1
	fi

	"$chrome" --pack-extension="$dirname"

	print "  comment{Cleaning up residual files}"
	rm -r "$dirname"
}

function generate_firefox_package() {
	print "info{Building Firefox upload package}"
	filename="build/elbo-extension-$(get_version)-firefox.zip"

	if [[ -e $filename ]]; then
		rm -r "$filename"
	fi

	mkdir -p build

	print "  comment{Creating ZIP archive}"
	zip -r "$filename" "${file_list[@]}"
}

function clean_build_files() {
	print "info{Cleaning build files}"
	rm -rf build
}

set -e # Exit on most errors
set -u # Warn on unbound variable use

cd "$(dirname "$0")"

if [[ -z ${1+x} ]]; then
	print "info{Usage}: $0 bold{target-browser}"
	print "Script to generate an upload package for the target browser."
	print "bold{target-browser} may be one of bold{firefox}, bold{chrome}, bold{opera} or bold{all}."
	exit 0
fi

case "$1" in
	"chrome")
		generate_chrome_package
		;;
	"opera")
		generate_opera_package
		;;
	"firefox")
		generate_firefox_package
		;;
	"all")
		generate_chrome_package
		generate_firefox_package
		generate_opera_package
		;;
	"clean")
		clean_build_files
		;;
	*)
		print "Unknown target browser: bold{$(esc "$1")}"
		exit 0
esac
