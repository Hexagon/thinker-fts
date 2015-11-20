/*

Copyright (c) 2015 Hexagon <robinnilsson@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict';

/* Default ranker */
function standard( options ) {

    var currentExpression,
        currentMatch,
        currentMatchWeight,
        currentFieldWeight,
        currentDocument,

        i, j, k, found, // iterators

        // Defaults
        options = options || {
            directHit: 1,
            partialHit: 0.5,
            allExpressionFactor: 2,
            allDirectExpressionFactor: 3,
            fields: {
                1: 1,
                2: 1,
                3: 1,
                4: 1,
                5: 1,
                6: 1,
                7: 1,
                8: 1,
                9: 1
            }
        };

    return  function ( resultSet ) {

        var documentResultsFinal = [],
            documentResults = {},

            directMatches,
            partialMatches,

            docExists;

        // Find all documents
        for ( var key = 0; key < resultSet.expressions.length; key++ ) {

            currentExpression = resultSet.expressions[key];

            directMatches = currentExpression.hits.direct;
            partialMatches = currentExpression.hits.partial;

            if (directMatches !== undefined ) {
                for( i = 0; i < directMatches.length; i+=3 ) {
                    currentMatchWeight = options.directHit * options.fields[directMatches[i+1]];
                    if ( docExists = documentResults[directMatches[i]] ) {
                        docExists.totalWeight += currentMatchWeight;
                        docExists.directMatches += directMatches[i+2];
                        docExists.directMatchedExpressions[key] = true;
                        docExists.matchedExpressions[key] = true;
                    } else {
                        documentResults[directMatches[i]] = {
                            documentId: directMatches[i],
                            totalWeight: currentMatchWeight,
                            directMatches: directMatches[i+2],
                            partialMatches: 0,
                            directMatchedExpressions: {},
                            matchedExpressions: {},
                        };
                        documentResults[directMatches[i]].directMatchedExpressions[key] = true;
                        documentResults[directMatches[i]].matchedExpressions[key] = true;
                    }
                }
            }

            if (partialMatches !== undefined ) {
                for( i = 0; i < partialMatches.length; i+=3 ) {
                    currentMatchWeight = options.partialHit * options.fields[partialMatches[i+1]];
                    if ( docExists = documentResults[partialMatches[i]] ) {
                        docExists.totalWeight += currentMatchWeight;
                        docExists.partialMatches += partialMatches[i+2];
                        docExists.matchedExpressions[key] = true;
                    } else {
                        documentResults[partialMatches[i]] = {
                            documentId: partialMatches[i],
                            totalWeight: currentMatchWeight,
                            partialMatches: partialMatches[i+2],
                            directMatches: 0,
                            directMatchedExpressions: {},
                            matchedExpressions: {}
                        };
                        documentResults[partialMatches[i]].matchedExpressions[key] = true;
                    }
                }
            }
        };

        // Convert document results from object to array (to be sortable)
        documentResultsFinal = Object.keys(documentResults).map(function (key) { return documentResults[key]; });

        // Sort documents by total weight
        documentResultsFinal.sort(function(a, b) {
            return b.totalWeight - a.totalWeight
        });

        // Postprocess resultset, multiplying total weight with a factor under certain circumstances
        if (options.allFieldsFactor !== 1 || options.allDirectFieldsFactor !== 1) {
            for ( i = 0; i < documentResultsFinal.length; i++) {

                // - Add extra weight if all expressions matched directly
                if (Object.keys(documentResultsFinal[i].directMatchedExpressions).length == resultSet.expressions.length) {
                    documentResultsFinal[i].totalWeight *= options.allDirectExpressionFactor;

                // - Add extra weight if all expressions matched at all
                } else if (Object.keys(documentResultsFinal[i].matchedExpressions).length == resultSet.expressions.length) {
                    documentResultsFinal[i].totalWeight *= options.allExpressionFactor;
                }

            }    
        }
        
        resultSet.documents = documentResultsFinal;

        return resultSet;
    }
    
};

module.exports = {
    standard: standard
}